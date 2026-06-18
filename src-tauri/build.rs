use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::SystemTime;

fn main() {
    println!("cargo:rerun-if-changed=../memreduct/memreduct.vcxproj");
    println!("cargo:rerun-if-changed=../memreduct/src");
    println!("cargo:rerun-if-changed=../memreduct/routine/src");

    if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        ensure_memreduct_helper().unwrap_or_else(|error| panic!("{error}"));
    }

    tauri_build::build()
}

fn ensure_memreduct_helper() -> Result<(), String> {
    let manifest_dir =
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").map_err(|error| error.to_string())?);
    let repo_root = manifest_dir
        .parent()
        .ok_or_else(|| "无法定位仓库根目录".to_string())?;
    let memreduct_dir = repo_root.join("memreduct");
    let project_file = memreduct_dir.join("memreduct.vcxproj");
    let output_file = memreduct_dir
        .join("bin")
        .join("64")
        .join("memreduct-viewstage.exe");

    if !project_file.exists() {
        return Ok(());
    }

    if !memreduct_needs_build(&output_file, &project_file, &memreduct_dir)? {
        return Ok(());
    }

    let msbuild = find_msbuild()?;

    println!(
        "cargo:warning=Building memreduct helper via {}",
        msbuild.display()
    );

    let status = Command::new(&msbuild)
        .arg(&project_file)
        .args([
            "/p:Configuration=Release",
            "/p:Platform=x64",
            "/m",
            "/nologo",
        ])
        .current_dir(repo_root)
        .status()
        .map_err(|error| format!("启动 MSBuild 失败: {error}"))?;

    if !status.success() {
        return Err(format!(
            "构建 memreduct-viewstage.exe 失败，MSBuild 退出码: {:?}",
            status.code()
        ));
    }

    if !output_file.exists() {
        return Err(format!(
            "MSBuild 完成后仍未找到 memreduct helper: {}",
            output_file.display()
        ));
    }

    Ok(())
}

fn memreduct_needs_build(
    output_file: &Path,
    project_file: &Path,
    memreduct_dir: &Path,
) -> Result<bool, String> {
    if !output_file.exists() {
        return Ok(true);
    }

    let output_time = fs::metadata(output_file)
        .and_then(|metadata| metadata.modified())
        .map_err(|error| format!("读取 memreduct helper 时间戳失败: {error}"))?;

    let mut inputs = vec![project_file.to_path_buf()];
    collect_files(&memreduct_dir.join("src"), &mut inputs)?;
    collect_files(&memreduct_dir.join("routine").join("src"), &mut inputs)?;

    for input in inputs {
        let input_time = fs::metadata(&input)
            .and_then(|metadata| metadata.modified())
            .map_err(|error| format!("读取 {} 时间戳失败: {error}", input.display()))?;

        if is_newer(input_time, output_time) {
            return Ok(true);
        }
    }

    Ok(false)
}

fn collect_files(directory: &Path, files: &mut Vec<PathBuf>) -> Result<(), String> {
    if !directory.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(directory)
        .map_err(|error| format!("读取目录 {} 失败: {error}", directory.display()))?
    {
        let entry = entry.map_err(|error| format!("读取目录项失败: {error}"))?;
        let path = entry.path();

        if path.is_dir() {
            collect_files(&path, files)?;
        } else {
            files.push(path);
        }
    }

    Ok(())
}

fn is_newer(left: SystemTime, right: SystemTime) -> bool {
    left.duration_since(right).is_ok()
}

fn find_msbuild() -> Result<PathBuf, String> {
    if let Some(path) = find_command_path("msbuild")? {
        return Ok(path);
    }

    let Some(program_files_x86) = env::var_os("ProgramFiles(x86)") else {
        return Err("找不到 ProgramFiles(x86)，无法定位 MSBuild".to_string());
    };

    let vswhere = PathBuf::from(program_files_x86)
        .join("Microsoft Visual Studio")
        .join("Installer")
        .join("vswhere.exe");

    if !vswhere.exists() {
        return Err("找不到 vswhere.exe，无法自动构建 memreduct helper".to_string());
    }

    let output = Command::new(vswhere)
        .args([
            "-latest",
            "-products",
            "*",
            "-requires",
            "Microsoft.Component.MSBuild",
            "-find",
            "MSBuild\\**\\Bin\\MSBuild.exe",
        ])
        .output()
        .map_err(|error| format!("运行 vswhere 失败: {error}"))?;

    if !output.status.success() {
        return Err(format!(
            "vswhere 执行失败: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let Some(path) = stdout
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(PathBuf::from)
    else {
        return Err("vswhere 未返回可用的 MSBuild 路径".to_string());
    };

    Ok(path)
}

fn find_command_path(command: &str) -> Result<Option<PathBuf>, String> {
    let output = Command::new("where.exe")
        .arg(command)
        .output()
        .map_err(|error| format!("查找 {command} 失败: {error}"))?;

    if !output.status.success() {
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(PathBuf::from))
}
