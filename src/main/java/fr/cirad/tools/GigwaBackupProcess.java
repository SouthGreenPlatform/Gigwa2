package fr.cirad.tools;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import fr.cirad.security.backup.IBackgroundProcess;
import fr.cirad.security.backup.ProcessStatus;



public class GigwaBackupProcess implements IBackgroundProcess {	
	private static final String dumpManagementPath = "WEB-INF/dump_management";
	private static final String defaultBackupDestinationFolder = dumpManagementPath + "/backups";
	private static final String dumpCommand = dumpManagementPath + "/dbDump.sh";
	private static final String restoreCommand = dumpManagementPath + "/dbRestore.sh";
	
	private String dbName;
	private List<String> hosts;
	private Process subprocess = null;
	private String basePath;
	private String outPath;
	
	private StringBuilder log;
	private ProcessStatus status;
	private String statusMessage;
	
	public GigwaBackupProcess(String dbName, List<String> hosts, String basePath, String outPath) {
		this.hosts = hosts;
		this.dbName = dbName;
		this.basePath = basePath;
		
		if (outPath == null) {
			this.outPath = this.basePath + defaultBackupDestinationFolder;
		} else {
			this.outPath = outPath;
		}
		
		File outPathCheck = new File(this.outPath);
		outPathCheck.mkdirs();
		
		this.log = new StringBuilder();
		this.status = ProcessStatus.IDLE;
	}
	
	public void startDump(String credentials) {
		(new Thread() {
			public void run() {
				File scriptFile = new File(basePath + dumpCommand);
				scriptFile.setReadable(true);
				scriptFile.setExecutable(true);
				
				String hostString = String.join(",", hosts);
				List<String> args = new ArrayList<String>(Arrays.asList(
					basePath + dumpCommand,
					"--host", hostString,
					"--output", outPath,
					"--database", dbName,
					"--log"
				));
				
				String password = null;
				if (credentials != null) {
					String[] loginAndAuthDb = credentials.split("@");
					String[] userAndPass = loginAndAuthDb[0].split(":");
					password = userAndPass[1];
					args.add("--username"); args.add(userAndPass[0]);
					args.add("--authenticationDatabase"); args.add(loginAndAuthDb[1]);
					args.add("--passwordPrompt");
				}
				
				ProcessBuilder builder = new ProcessBuilder(args);
				builder.redirectErrorStream(true);
				
				runProcess(builder, password);
			}
		}).start();
	}
	
	public void startRestore(String backupFile, boolean drop, String credentials) {
		(new Thread() {
			public void run() {
				File scriptFile = new File(basePath + restoreCommand);
				scriptFile.setReadable(true);
				scriptFile.setExecutable(true);
				
				String hostString = String.join(",", hosts);
				List<String> args = new ArrayList<String>(Arrays.asList(
					basePath + restoreCommand,
					"--host", hostString,
					"--input", backupFile,
					"--log"
				));
				
				String password = null;
				if (drop) args.add("--drop");
				if (credentials != null) {
					String[] loginAndAuthDb = credentials.split("@");
					String[] userAndPass = loginAndAuthDb[0].split(":");
					args.add("--username"); args.add(userAndPass[0]);
					args.add("--authenticationDatabase"); args.add(loginAndAuthDb[1]);
					args.add("--passwordPrompt"); 
					password = userAndPass[1];
				}
				
				ProcessBuilder builder = new ProcessBuilder(args);
				builder.redirectErrorStream(true);
				
				runProcess(builder, password);
			}
		}).start();
	}
	
	
	public String getLog(){
		this.updateLog();
		return this.log.toString();
	}
	
	private void updateLog() {
		try {
			InputStream stream = this.subprocess.getInputStream();
			int length = stream.available();
			for (int i = 0; i < length; i++) {
				this.log.append((char)stream.read());
			}
		} catch (IOException e) {
			this.statusMessage = "Error : " + e.toString();
		}
	}
	
	public ProcessStatus getStatus() {
		return this.status;
	}
	
	public String getStatusMessage() {
		return this.statusMessage;
	}
	
	
	private void runProcess(ProcessBuilder builder, String password) {
		try {
			status = ProcessStatus.RUNNING;
			statusMessage = "Running " + String.join(" ", builder.command());
			subprocess = builder.start();
			if (password != null) {
				OutputStream stdin = subprocess.getOutputStream();
				stdin.write((password + "\n").getBytes("utf-8"));
				stdin.flush();
			}
		} catch (IOException e) {
			status = ProcessStatus.ERROR;
			statusMessage = "Error : " + e.toString();
			return;
		} catch (SecurityException e) {
			status = ProcessStatus.ERROR;
			statusMessage = "Security error : " + e.toString();
			return;
		}


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
}
