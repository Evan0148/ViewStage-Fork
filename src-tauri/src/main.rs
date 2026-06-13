#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        let args: Vec<String> = std::env::args().collect();
        if args.len() > 1 && (args[1] == "--mem-clean" || args[1] == "--clean") {
            let ret = viewstage_lib::mem_clean_perform();
            std::process::exit(ret);
        }
    }

    viewstage_lib::app_init_run()
}
