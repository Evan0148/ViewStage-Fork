use image::{DynamicImage, ImageBuffer, Rgba, GenericImageView};
use rayon::prelude::*;
use base64::{Engine as _, engine::general_purpose};
use serde::{Deserialize, Serialize};

const MAX_IMAGE_SIZE: usize = 50 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailRequest {
    pub image_data: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailResult {
    pub thumbnail: Option<String>,
    pub error: Option<String>,
}

pub fn decode_base64_image(image_data: &str) -> Result<DynamicImage, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',')
            .nth(1)
            .ok_or("Invalid base64 image data")?
            .to_string()
    } else {
        image_data.to_string()
    };
    
    if base64_data.len() > MAX_IMAGE_SIZE * 4 / 3 {
        return Err("Image data too large (max 50MB)".to_string());
    }
    
    let decoded = general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    let img = image::load_from_memory(&decoded)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    if img.width() == 0 || img.height() == 0 {
        return Err("Invalid image dimensions: width or height is zero".to_string());
    }
    
    Ok(img)
}

pub fn extract_base64(image_data: &str) -> Result<Vec<u8>, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',')
            .nth(1)
            .ok_or("Invalid base64 image data")?
    } else {
        image_data
    };
    
    general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))
}



#[tauri::command]
pub fn generate_thumbnail(image_data: String, max_size: u32, fixed_ratio: bool) -> Result<String, String> {
    if max_size == 0 {
        return Err("max_size must be greater than 0".to_string());
    }
    
    let img = decode_base64_image(&image_data)?;
    generate_thumbnail_from_image(&img, max_size, fixed_ratio)
}

fn generate_thumbnail_from_image(img: &DynamicImage, max_size: u32, fixed_ratio: bool) -> Result<String, String> {
    let (width, height) = (img.width(), img.height());
    
    let (thumb_w, thumb_h, scaled_w, scaled_h, offset_x, offset_y) = if fixed_ratio {
        let tw = max_size;
        let th = ((max_size as f32 * 9.0 / 16.0).max(1.0)) as u32;
        
        let img_ratio = width as f32 / height as f32;
        let canvas_ratio = 16.0 / 9.0;
        
        let (sw, sh) = if img_ratio > canvas_ratio {
            (tw, ((tw as f32 / img_ratio).max(1.0)) as u32)
        } else {
            (((th as f32 * img_ratio).max(1.0)) as u32, th)
        };
        
        let ox = (tw - sw) / 2;
        let oy = (th - sh) / 2;
        
        (tw, th, sw, sh, ox, oy)
    } else {
        let (tw, th) = if width > height {
            (max_size, ((height as f32 * max_size as f32 / width as f32).max(1.0)) as u32)
        } else {
            (((width as f32 * max_size as f32 / height as f32).max(1.0)) as u32, max_size)
        };
        
        (tw, th, tw, th, 0, 0)
    };
    
    let scaled_img = img.thumbnail(scaled_w, scaled_h);
    
    let mut canvas: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(thumb_w, thumb_h);
    
    for pixel in canvas.pixels_mut() {
        *pixel = Rgba([0, 0, 0, 255]);
    }
    
    for (x, y, pixel) in scaled_img.pixels() {
        let canvas_x = x + offset_x;
        let canvas_y = y + offset_y;
        if canvas_x < thumb_w && canvas_y < thumb_h {
            canvas.put_pixel(canvas_x, canvas_y, pixel);
        }
    }
    
    let mut buffer = Vec::new();
    DynamicImage::ImageRgba8(canvas)
        .write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;
    
    Ok(format!("data:image/jpeg;base64,{}", general_purpose::STANDARD.encode(&buffer)))
}

#[tauri::command]
pub fn generate_thumbnails_batch(images: Vec<ThumbnailRequest>, max_size: u32, fixed_ratio: bool) -> Result<Vec<ThumbnailResult>, String> {
    if max_size == 0 {
        return Err("max_size must be greater than 0".to_string());
    }
    
    let results: Vec<ThumbnailResult> = images
        .par_iter()
        .map(|req| {
            match decode_base64_image(&req.image_data) {
                Ok(img) => match generate_thumbnail_from_image(&img, max_size, fixed_ratio) {
                    Ok(thumbnail) => ThumbnailResult {
                        thumbnail: Some(thumbnail),
                        error: None,
                    },
                    Err(e) => ThumbnailResult {
                        thumbnail: None,
                        error: Some(e),
                    },
                },
                Err(e) => ThumbnailResult {
                    thumbnail: None,
                    error: Some(e),
                },
            }
        })
        .collect();
    
    Ok(results)
}

#[tauri::command]
pub fn rotate_image(image_data: String, direction: String) -> Result<String, String> {
    let img = decode_base64_image(&image_data)?;
    
    let rotated = if direction == "left" {
        img.rotate270()
    } else {
        img.rotate90()
    };
    
    let mut buffer = Vec::new();
    rotated
        .write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode rotated image: {}", e))?;
    
    let result = format!("data:image/png;base64,{}", general_purpose::STANDARD.encode(&buffer));
    
    Ok(result)
}
