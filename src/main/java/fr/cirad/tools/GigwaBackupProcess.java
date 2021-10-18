package fr.cirad.tools;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import fr.cirad.security.backup.IBackgroundProcess;
import fr.cirad.security.backup.ProcessStatus;



public class GigwaBackupProcess implements IBackgroundProcess {	
	private static final String dumpManagementPath = "WEB-INF/dump_management";
	private static final String backupDestinationFolder = dumpManagementPath + "/backups";
	private static final String dumpCommand = dumpManagementPath + "/dbDump.sh";
	private static final String restoreCommand = dumpManagementPath + "/dbRestore.sh";
	
	private String dbName;
	private List<String> hosts;
	private Process subprocess = null;
	private String basePath;
	
	private StringBuilder log;
	private ProcessStatus status;
	private String statusMessage;
	
	public GigwaBackupProcess(String dbName, List<String> hosts, String basePath) {
		this.hosts = hosts;
		this.dbName = dbName;
		this.basePath = basePath;
		this.log = new StringBuilder();
		this.status = ProcessStatus.IDLE;
	}
	
	public void startDump() {
		File scriptFile = new File(this.basePath + dumpCommand);
		scriptFile.setReadable(true);
		scriptFile.setExecutable(true);
		
		String hostString = String.join(",", this.hosts);
		ProcessBuilder builder = new ProcessBuilder(
			this.basePath + dumpCommand,
			"--host", hostString,
			"--output", this.basePath + backupDestinationFolder,
			"--database", this.dbName,
			"--log"
		);
		builder.redirectErrorStream(true);
		
		try {
			this.status = ProcessStatus.RUNNING;
			this.statusMessage = "Running " + String.join(" ", builder.command());
			subprocess = builder.start();
		} catch (IOException e) {
			this.status = ProcessStatus.ERROR;
			this.statusMessage = "Error : " + e.toString();
			return;
		} catch (SecurityException e) {
			this.status = ProcessStatus.ERROR;
			this.statusMessage = "Error : " + e.toString();
			return;
		}
		
		(new Thread() {
			public void run() {
				try {
					int exitcode = subprocess.waitFor();
					if (exitcode == 0) {
						status = ProcessStatus.SUCCESS;
						statusMessage = "Finished";
					} else {
						status = ProcessStatus.ERROR;
						statusMessage = "Process exited with code " + exitcode;
					}
				} catch (InterruptedException e) {
					status = ProcessStatus.INTERRUPTED;
					statusMessage = "Interrupted : " + e.toString();
				}
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
		try {
			if (this.subprocess.getInputStream().available() > 0) {
				InputStream stream = this.subprocess.getInputStream();
				int character;
				
				while ((character = stream.read()) != -1) {
					this.log.append((char)character);
				}
			}
		} catch (IOException e) {
			this.statusMessage = "Error : " + e.toString();
		}
		return this.log.toString();
	}
	
	public ProcessStatus getStatus() {
		return this.status;
	}
	
	public String getStatusMessage() {
		return this.statusMessage;
	}
}
