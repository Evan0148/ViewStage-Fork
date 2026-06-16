#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        let args: Vec<String> = std::env::args().collect();
        if args.len() > 1 {
            match args[1].as_str() {
                "--uninstall-cleanup" | "--cleanup" => {
                    let ret = viewstage_lib::uninstall_cleanup_perform();
                    std::process::exit(ret);
                }
                _ => {}
            }
        }
    }

    viewstage_lib::app_init_run()
}
