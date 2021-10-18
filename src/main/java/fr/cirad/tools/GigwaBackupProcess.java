package fr.cirad.tools;

import fr.cirad.security.backup.IBackgroundProcess;
import fr.cirad.security.backup.ProcessStatus;



public class GigwaBackupProcess implements IBackgroundProcess {	
	private static final String dumpManagementPath = "/WEB-INF/dump_management";
	private static final String backupDestinationFolder = dumpManagementPath + "/backups";
	private static final String dumpCommand = dumpManagementPath + "/dbDump.sh";
	private static final String restoreCommand = dumpManagementPath + "/dbRestore.sh";
	
	private String moduleName;
	private Process subprocess = null;
	
	private StringBuilder log;
	private ProcessStatus status;
	private String statusMessage;
	
	public GigwaBackupProcess(String moduleName) {
		this.moduleName = moduleName;
		this.log = new StringBuilder();
		this.status = ProcessStatus.IDLE;
		this.statusMessage = null;
	}
	
	public void startDump() {
		(new Thread() {
			public void run() {
				status = ProcessStatus.RUNNING;
				for (int i = 0; i < 50; i++) {
					String logLine = "This is the log line no. " + i + "\n";
					log.append(logLine);
					
					try {
						Thread.sleep((long) (Math.random() * 1000));
					} catch (InterruptedException e) {
						status = ProcessStatus.INTERRUPTED;
						statusMessage = e.toString();
						return;
					}
				}
				status = ProcessStatus.SUCCESS;
			}
		}).start();
	}
	
	public void startRestore(String backupName) {
		(new Thread() {
			public void run() {
				for (int i = 0; i < 50; i++) {
					String logLine = "This is the log line no. " + i + "\n";
					log.append(logLine);
					
					try {
						Thread.sleep((long) (Math.random() * 1000));
					} catch (InterruptedException e) {
						status = ProcessStatus.INTERRUPTED;
						statusMessage = e.toString();
						return;
					}
				}
				status = ProcessStatus.SUCCESS;
			}
		}).start();
	}
	
	public String getLog(){
		return this.log.toString();
	}
	
	public ProcessStatus getStatus() {
		return this.status;
	}
	
	public String getStatusMessage() {
		return this.statusMessage;
	}
}
