use tauri::command;
use sysinfo::{Pid, System, ProcessesToUpdate};
use listeners::get_all;
use serde::Serialize;

#[derive(Serialize)]
struct PortInfo {
    pid: u32,
    name: String,
    port: u16,
    protocol: String,
    address: String,
}

#[command]
fn get_ports() -> Vec<PortInfo> {
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut ports = Vec::new();

    if let Ok(listeners) = get_all() {
        for l in listeners {
            let pid_u32 = l.process.pid;
            let process_name = if pid_u32 != 0 {
                sys.process(Pid::from(pid_u32 as usize))
                    .map(|p| p.name().to_string_lossy().into_owned())
                    .unwrap_or_else(|| l.process.name.clone()) // Fallback to listener's process name if available
            } else {
                "System".to_string()
            };
            
            ports.push(PortInfo {
                pid: pid_u32,
                name: process_name,
                port: l.socket.port(),
                protocol: l.protocol.to_string(),
                address: l.socket.ip().to_string(),
            });
        }
    }
    ports.sort_by(|a, b| a.port.cmp(&b.port));
    ports
}

#[command]
fn kill_process(pid: u32) -> bool {
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    
    if let Some(process) = sys.process(Pid::from(pid as usize)) {
        return process.kill();
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![get_ports, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
