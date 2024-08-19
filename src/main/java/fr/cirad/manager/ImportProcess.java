package fr.cirad.manager;

import fr.cirad.tools.ProgressIndicator;

public class ImportProcess extends AbstractProcess {
    private ProgressIndicator progress;

    public ImportProcess(ProgressIndicator progress, String module) {
        this.progress = progress;
        this.module = module;
        this.status = ProcessStatus.IDLE;
    }

    @Override
    public String getProcessID() {
        return progress.getProcessId();
    }

    @Override
    public ProcessStatus getStatus() {
        return progress.isAborted() ? ProcessStatus.INTERRUPTED : (progress.isComplete() ? ProcessStatus.SUCCESS : progress.getError() != null ? ProcessStatus.ERROR : ProcessStatus.RUNNING);
    }

    @Override
    public String getStatusMessage() {
        return progress.isComplete() ? "Import complete" : progress.getProgressDescription();
    }

    @Override
    public void abort() {
    	progress.abort();
        this.status = ProcessStatus.INTERRUPTED;
        this.statusMessage = "Import process aborted";
    }

	@Override
	public String getLog() {
		return null;
	}

	@Override
	public String getAbortWarning() {
		return null;
	}
}