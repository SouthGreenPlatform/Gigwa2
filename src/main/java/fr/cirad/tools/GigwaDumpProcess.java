package fr.cirad.tools;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.zip.GZIPInputStream;

import org.apache.commons.compress.compressors.gzip.GzipCompressorOutputStream;
import org.apache.commons.compress.compressors.gzip.GzipParameters;
import org.apache.log4j.Logger;

import fr.cirad.manager.dump.IBackgroundProcess;
import fr.cirad.manager.dump.ProcessStatus;
import fr.cirad.mgdb.importing.base.AbstractGenotypeImport;
import fr.cirad.tools.mongo.MongoTemplateManager;

public class GigwaDumpProcess implements IBackgroundProcess {
    
    private static final Logger LOG = Logger.getLogger(GigwaDumpProcess.class);
    
    static final String dumpManagementPath = "WEB-INF" + File.separator + "dump_management";
    public static String operatingSystem = System.getProperty("os.name").toLowerCase();
    private static String scriptExtension = operatingSystem.startsWith("win") ? "bat" : (operatingSystem.startsWith("mac") ? "command" : "sh");
    private static final String dumpCommand = dumpManagementPath + File.separator + "dbDump." + scriptExtension;
    private static final String restoreCommand = dumpManagementPath + File.separator + "dbRestore." + scriptExtension;

	private String module;
	private String dbName;
	private List<String> hosts;
	private Process subprocess = null;
	private String basePath;
	private String outPath;
	private boolean abortable = false;
	private boolean deleteOnError;
	private String abortWarning;

	private StringBuilder log;
	private String logFile;
	private ProcessStatus status;
	private String statusMessage;
	private boolean aborted = false;

	public GigwaDumpProcess(String module, String dbName, List<String> hosts, String basePath, String outPath) {
		this.module = module;
		this.hosts = hosts;
		this.dbName = dbName;
		this.basePath = basePath;
		this.outPath = outPath;

		new File(this.outPath).mkdirs();

		this.log = new StringBuilder();
		this.status = ProcessStatus.IDLE;
	}

	public void startDump(String fileName, String credentials) {
		abortable = true;
		deleteOnError = true;
		abortWarning = null;
		logFile = outPath + File.separator + fileName + "__dump.log";
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
					"--name", fileName,
					"--log", logFile
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

				runProcess(builder, password, null);
			}
		}).start();
	}

	public void startRestore(String dumpFile, boolean drop, String credentials) {
		abortable = true;
		deleteOnError = false;
		abortWarning = "This database may be left in an unstable state if you proceed.";
		logFile = dumpFile.substring(0, dumpFile.indexOf(".gz")) + "__restore-" + DateTimeFormatter.ofPattern("uuuuMMddHHmmss").format(LocalDateTime.now()) + ".log";
		(new Thread() {
			public void run() {
				File scriptFile = new File(basePath + restoreCommand);
				scriptFile.setReadable(true);
				scriptFile.setExecutable(true);

				String hostString = String.join(",", hosts);
				List<String> args = new ArrayList<String>(Arrays.asList(
					basePath + restoreCommand,
                    "--nsFrom", "\"" + dumpFile.substring(dumpFile.lastIndexOf(File.separator) + 1).split("__")[0] + ".*\"",
                    "--nsTo", "\"" + dbName + ".*\"",
					"--host", hostString,
					"--input", dumpFile,
					"--log", logFile
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

				runProcess(builder, password, dumpFile);
			}
		}).start();
	}


	public String getLog(){
		if (this.log != null) {
			this.updateLog();
			return this.log.toString();
		} else {
			File plainLogFile = new File(logFile);
			File gzippedLogFile = new File(logFile + ".gz");
			InputStream logInput = null;
            boolean fDeletePlainFile = false;
			try {

                if (gzippedLogFile.exists())
                    logInput = new GZIPInputStream(new FileInputStream(gzippedLogFile));
                else if (plainLogFile.exists()) {   // Windows script does not gzip logfiles: let's do it now
                    logInput = new FileInputStream(plainLogFile);
                    try (GzipCompressorOutputStream gos = new GzipCompressorOutputStream(new FileOutputStream(gzippedLogFile), new GzipParameters() {{setFilename(plainLogFile.getName());}} )) {
                        Files.copy(plainLogFile.toPath(), gos);
                        fDeletePlainFile = true;
                    }
                }
                else
                    throw new FileNotFoundException();

				int readLength;
				ByteArrayOutputStream logBuilder = new ByteArrayOutputStream();
				byte[] buffer = new byte[65536];  // FIXME ?
				while ((readLength = logInput.read(buffer)) != -1)
					logBuilder.write(buffer, 0, readLength);

				return logBuilder.toString("UTF-8");
			} catch (FileNotFoundException e) {
				return "Log file not found";
			} catch (IOException e) {
				return "Error reading the log file";
			} finally {
				try {
					if (logInput != null)
						logInput.close();

					if (fDeletePlainFile)
	                    plainLogFile.delete();
				} catch (Throwable t) {
					LOG.error(t);
				}
			}
		}
	}

	private void updateLog() {
		if (this.log != null && this.subprocess != null) {
			try {
				InputStream stream = this.subprocess.getInputStream();
				int length = stream.available();
				for (int i = 0; i < length; i++) {
					this.log.append((char)stream.read());
				}
			} catch (IOException e) {
				// Most likely, stream closed. Just return the last known state.
			}
		}
	}

	public String getModule() {
		return module;
	}

	public ProcessStatus getStatus() {
		return this.status;
	}

	public String getStatusMessage() {
		return this.statusMessage;
	}

	public boolean isAbortable() {
		return this.abortable;
	}

	public String getAbortWarning() {
		return this.abortWarning;
	}

	public void abort() {
		if (this.abortable) {
			this.aborted = true;
			this.subprocess.destroy();
		}
	}


	private void runProcess(ProcessBuilder builder, String password, String dumpFile) {
		AbstractGenotypeImport.lockModuleForWriting(module);
		try {
			status = ProcessStatus.RUNNING;
			statusMessage = "Running " + String.join(" ", builder.command());
			subprocess = builder.start();
			if (password != null) {
				OutputStream stdin = subprocess.getOutputStream();
				stdin.write((password + "\n").getBytes("utf-8"));
				stdin.flush();
			}

			int exitcode = subprocess.waitFor();
			if (exitcode == 0) {
				status = ProcessStatus.SUCCESS;
				statusMessage = "Finished";
				if (dumpFile != null) {
					MongoTemplateManager.updateDatabaseLastModification(this.module,
							Date.from(Files.readAttributes(new File(dumpFile).toPath(), BasicFileAttributes.class).creationTime().toInstant()),
							true);
				}
				this.log = null;  // Eventually deletes the log, from now on it will be read from disk
			} else if (aborted) {
				status = ProcessStatus.INTERRUPTED;
				statusMessage = "Aborted by user";
				onError();
			} else {
				status = ProcessStatus.ERROR;
				statusMessage = "Process exited with code " + exitcode;
				onError();
			}
		} catch (IOException e) {
			status = ProcessStatus.ERROR;
			statusMessage = "Error : " + e.toString();
		} catch (SecurityException e) {
			status = ProcessStatus.ERROR;
			statusMessage = "Security error : " + e.toString();
		} catch (InterruptedException e) {
			status = ProcessStatus.INTERRUPTED;
			statusMessage = "Interrupted : " + e.toString();
		} finally {
			AbstractGenotypeImport.unlockModuleForWriting(module);
		}
	}

	private void onError() {
		if (deleteOnError) {
			updateLog();
			for (String line : this.log.toString().split("\n")) {
				if (line.startsWith("Name : ")) {
					String dumpName = line.split(":")[1].trim();

					for (File file : new File(this.outPath).listFiles()) {
						String filename = file.getName();
						if (filename.startsWith(dumpName) && (filename.endsWith(".log") || filename.endsWith(".gz") || filename.endsWith(".txt")))
							file.delete();
					}
				}
			}
		}
	}
}
