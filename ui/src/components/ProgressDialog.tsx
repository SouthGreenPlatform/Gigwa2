import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import endpoints from "../endpoints";
import "../styles/progress-dialog.scss";

interface ProgressDialogProps {
  progressToken: string;
  progressTokens?: string[];
  size?: 'sm' | 'lg' | 'xl';
  show: boolean;
  onHide?: () => void;
  title?: string;
  nbMin?: number; // multiplicative factor for polling interval
  showAbort?: boolean;
  onAbort?: () => void;
  autoClose?: boolean;
  renderOnComplete?: (progressMessage: string) => React.ReactNode;
  renderOnError?: (progressMessage: string) => React.ReactNode;
  /** Optional list of named operations to display with individual done/pending indicators. */
  extraItems?: { label: string; done: boolean }[];
}

type ProgressIndicator = {
  complete?: boolean;
  aborted?: boolean;
  error?: string;
  progressDescription?: string;
  finalMessage?: string;
};

const PROGRESS_INDICATOR_KEYS: Array<keyof ProgressIndicator> = [
  "complete",
  "aborted",
  "error",
  "progressDescription",
  "finalMessage",
];

function isProgressIndicator(value: unknown): value is ProgressIndicator {
  if (!value || typeof value !== "object") return false;
  return PROGRESS_INDICATOR_KEYS.some((key) => key in (value as Record<string, unknown>));
}

function extractProgressIndicators(value: unknown): ProgressIndicator[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap(extractProgressIndicators);
  }

  if (typeof value !== "object") {
    return [];
  }

  const node = value as Record<string, unknown>;

  // Prioritize explicit nested progress containers when present.
  const nested = [
    ...extractProgressIndicators(node.progressIndicators),
    ...extractProgressIndicators(node.progressIndicator),
  ];
  if (nested.length > 0) return nested;

  if (isProgressIndicator(node)) {
    return [node];
  }

  // Fallback for map-like payloads keyed by indicator id.
  return Object.values(node).flatMap(extractProgressIndicators);
}

function normalizeProgressIndicators(payload: any): ProgressIndicator[] {
  return extractProgressIndicators(payload).filter(Boolean);
}

function buildProgressDescriptionText(indicators: ProgressIndicator[]): string {
  const activeIndicators = indicators.filter((indicator) => !(indicator.complete || indicator.aborted));
  const source = activeIndicators.length > 0 ? activeIndicators : indicators;

  return source
    .map((indicator) => indicator.progressDescription || indicator.finalMessage || "Working...")
    .join("\n\n");
}

const ProgressDialog: React.FC<ProgressDialogProps> = ({
  progressToken,
  progressTokens,
  size,
  show,
  onHide,
  title = "Progress",
  nbMin = 1,
  showAbort = false,
  onAbort,
  autoClose = true,
  renderOnComplete,
  renderOnError,
  extraItems,
}) => {
  const [progressText, setProgressText] = useState("Initializing...");
  const [abortRequested, setAbortRequested] = useState(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const modalBaseWidth = size === 'sm' ? 300 : size === 'lg' ? 800 : size === 'xl' ? 1140 : 500;
  const modalWidth = Math.round(modalBaseWidth * 1.5);
  const modalStyle: React.CSSProperties = {
    ['--bs-modal-width' as any]: `min(95vw, ${modalWidth}px)`,
  };

  const trackedProgressTokens = Array.from(new Set(
    (progressTokens && progressTokens.length > 0 ? progressTokens : [progressToken])
      .map((tokenValue) => (tokenValue ?? "").trim())
      .filter((tokenValue) => tokenValue.length > 0)
  ));
  const trackedTokensKey = trackedProgressTokens.join("\0");

  useEffect(() => {
    let intervalId: number | null = null;
    const activeTokens = new Set(trackedProgressTokens);
    const emptyResponseStreakByToken = new Map<string, number>();
    const baseInterval = 1000;
    const pollInterval = baseInterval * nbMin;
    setAbortRequested(false);
    setIsComplete(false);
    setIsError(false);

    const fetchProgress = async () => {
      const tokensToCheck = Array.from(activeTokens);
      if (tokensToCheck.length === 0) {
        if (intervalId) clearInterval(intervalId);
        if (onHide) onHide();
        return;
      }

      try {
        const progressResults = await Promise.all(
          tokensToCheck.map(async (tokenValue) => {
            try {
              const response = await fetch(
                `${endpoints.PROGRESS_URL}?progressToken=${encodeURIComponent(tokenValue)}`
              );
              if (!response.ok) {
                return {
                  tokenValue,
                  indicators: [] as ProgressIndicator[],
                  fetchError: `Failed to fetch progress for ${tokenValue} (status ${response.status}).`,
                };
              }
              const json = await response.json();
              return { tokenValue, indicators: normalizeProgressIndicators(json), fetchError: null as string | null };
            } catch {
              return {
                tokenValue,
                indicators: [] as ProgressIndicator[],
                fetchError: `Error fetching progress for ${tokenValue}.`,
              };
            }
          })
        );

        const indicators = progressResults.flatMap((result) => result.indicators);
        const fetchErrors = progressResults
          .map((result) => result.fetchError)
          .filter((error): error is string => Boolean(error));
        if (fetchErrors.length > 0) {
          console.warn("Progress fetch warnings:", fetchErrors);
        }

        progressResults.forEach((result) => {
          if (result.indicators.length === 0) {
            const nextEmptyCount = (emptyResponseStreakByToken.get(result.tokenValue) ?? 0) + 1;
            emptyResponseStreakByToken.set(result.tokenValue, nextEmptyCount);
            if (nextEmptyCount >= 10) {
              activeTokens.delete(result.tokenValue);
            }
            return;
          }

          emptyResponseStreakByToken.set(result.tokenValue, 0);

          // Some backends can keep historical non-terminal entries alongside a terminal one.
          // As soon as we observe complete/aborted for a token, stop polling it.
          const isTerminal = result.indicators.some((indicator) => indicator.complete || indicator.aborted);
          if (isTerminal) {
            activeTokens.delete(result.tokenValue);
          }
        });

        if (indicators.length === 0) {
          setProgressText("Waiting for progress updates...");
          return;
        }

        const hasError = indicators.some((indicator) => indicator.error != null);
        const allCompleteOrAborted = progressResults.every(
          (result) => result.indicators.length > 0 && result.indicators.every(p => p.complete || p.aborted)
        );

        if (hasError) {
          if (intervalId) clearInterval(intervalId);

          const errorMessage = indicators.find((indicator) => indicator.error != null)?.error?.trim() || "An unexpected error occurred.";
          const erroredTokens = new Set(
            progressResults
              .filter((result) => result.indicators.some((indicator) => indicator.error != null))
              .map((result) => result.tokenValue)
          );
          const tokensToAbort = tokensToCheck.filter((tokenValue) => !erroredTokens.has(tokenValue));

          activeTokens.clear();
          setIsError(true);
          setProgressText(errorMessage);

          if (tokensToAbort.length > 0) {
            const abortResults = await Promise.all(
              tokensToAbort.map(async (tokenValue) => {
                try {
                  const response = await fetch(
                    `${endpoints.ABORT_PROCESS_URL}?progressToken=${encodeURIComponent(tokenValue)}`,
                    { method: "DELETE" }
                  );
                  if (!response.ok) {
                    return { tokenValue, processAborted: false };
                  }
                  const json = await response.json();
                  return {
                    tokenValue,
                    processAborted: (json as { processAborted?: boolean })?.processAborted === true,
                  };
                } catch {
                  return { tokenValue, processAborted: false };
                }
              })
            );

            const failedAborts = abortResults.filter((result) => !result.processAborted).map((result) => result.tokenValue);
            if (failedAborts.length > 0) {
              console.warn("Unable to abort tracked processes after progress error:", failedAborts);
            }
          }

          onAbort?.();
          return;
        }

        if (allCompleteOrAborted) {
          if (intervalId) clearInterval(intervalId);
          if (autoClose && onHide) {
            onHide();
          } else {
            if (indicators.some(p => p.aborted)) {
              setProgressText("Process was aborted.");
            } else {
              setIsComplete(true);
              const finalMessages = indicators.map(p => p.finalMessage).filter(Boolean);
              setProgressText(
                finalMessages.length > 0
                  ? finalMessages.join("\n")
                  : buildProgressDescriptionText(indicators)
              );
            }
          }
        } else {
          setProgressText(buildProgressDescriptionText(indicators));
        }

        if (activeTokens.size === 0) {
          if (intervalId) clearInterval(intervalId);
          if (autoClose && onHide) onHide();
          return;
        }
      } catch (err) {
        setProgressText("Error fetching progress. Check console for details.");
        console.log("Error fetching progress:", err);
      }
    };

    if (show && trackedProgressTokens.length > 0) {
      fetchProgress(); // Initial fetch
      intervalId = window.setInterval(fetchProgress, pollInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [show, trackedTokensKey, nbMin, onHide, autoClose]);

  useEffect(() => {
    if (!show) setProgressText("Initializing...");
  }, [show]);

  const handleHide = () => {
    if (onHide) onHide();
    setIsError(false);
    setIsComplete(false);
  };

  const handleAbort = async () => {
    if (abortRequested) return;
    setAbortRequested(true);
    try {
      const tokenStatuses = await Promise.all(
        trackedProgressTokens.map(async (tokenValue) => {
          try {
            const progressResponse = await fetch(
              `${endpoints.PROGRESS_URL}?progressToken=${encodeURIComponent(tokenValue)}`
            );
            if (!progressResponse.ok) {
              return { tokenValue, isCompletedOrAborted: false };
            }
            const progressJson = await progressResponse.json();
            const indicators = normalizeProgressIndicators(progressJson);
            const isCompletedOrAborted = indicators.length > 0
              && indicators.every((indicator) => indicator.complete || indicator.aborted);
            return { tokenValue, isCompletedOrAborted };
          } catch {
            return { tokenValue, isCompletedOrAborted: false };
          }
        })
      );

      const tokensToAbort = tokenStatuses
        .filter((status) => !status.isCompletedOrAborted)
        .map((status) => status.tokenValue);

      const abortResults = await Promise.all(
        tokensToAbort.map(async (tokenValue) => {
          const response = await fetch(
            `${endpoints.ABORT_PROCESS_URL}?progressToken=${encodeURIComponent(tokenValue)}`,
            { method: "DELETE" }
          );
          if (!response.ok) {
            return { tokenValue, processAborted: false };
          }
          const json = await response.json();
          return {
            tokenValue,
            processAborted: (json as { processAborted?: boolean })?.processAborted === true,
          };
        })
      );

      const notAbortedCount = abortResults.filter((result) => !result.processAborted).length;
      if (notAbortedCount > 0) {
        window.alert(`${notAbortedCount} process(es) could not be aborted.`);
      }/* else if (tokensToAbort.length > 0) {
        window.alert("All tracked processes were aborted.");
      } else {
        window.alert("All tracked processes were already completed or aborted.");
      }*/

      console.log("Abort result:", abortResults);
      onAbort?.();
      handleHide();
    } catch (err) {
      console.error("Abort error:", err);
      window.alert("Unable to abort one or more processes.");
      handleHide();
    }
  };

  return (
    <Modal
      size={size}
      show={show}
      onHide={handleHide}
      backdrop="static"
      keyboard={false}
      centered
      style={modalStyle}
      className="progress-dialog-modal"
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isComplete && !isError && (
          <>
            <div id="progressText" className="progress-dialog-text">{progressText}</div>
            {extraItems && extraItems.length > 0 && (
              <ul className="progress-dialog-list">
                {extraItems.map((item, i) => (
                  <li key={i} className="progress-dialog-list-item">
                    {item.done
                      ? <span className="progress-dialog-check">✓</span>
                      : <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" />}
                    <span className="progress-dialog-item-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {isComplete && renderOnComplete?.(progressText)}
        {isError && (renderOnError?.(progressText) ?? (
          <div className="progress-dialog-error">
            <strong>Operation failed</strong>
            <div>{progressText}</div>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        {showAbort && !isComplete && !isError && (
          <Button variant="danger" onClick={handleAbort} disabled={abortRequested}>
            Abort
          </Button>
        )}
        {(isComplete || isError) && (
          <Button variant="secondary" onClick={handleHide}>
            Close
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProgressDialog;