// Import axios
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import endpoints from "../endpoints";

// Define types for the global variables and functions
interface StringBuffer {
  buffer: string[];
  append(str: string): void;
  toString(): string;
}

// Check whether a string represents a valid number
export function isNumeric(str: string | number){
  return !isNaN(Number(str)) && !isNaN(parseFloat(String(str)));
}

// Get the constant prefix in each element of a list of strings
export function getPrefix(names: any[]){
  if (names.length <= 1) return "";  // Prevent returning the whole name as a prefix if there's only one
  let terminate = false;
  let prefix = "";
  for (let index in names[0]){
    let character = names[0][index]
    for (let name of names){
      if (name[index] != character){
        terminate = true;
        break;
      }
    }
    if (terminate){
      break; 
    } else {
      prefix += character;
    }
  }
  return prefix;
}
	
// Get the prefixes present at least twice in elements of a list of strings, along with their numbers of occurences (prefixes are anything before a digit occurence)
export function getContigPrefixes(contigNames: string | any[]) {
  let prefixCounts: { [key: string]: number } = {};
  for (let i = 0; i < contigNames.length; i++) {
    let pfx = contigNames[i].replace(/\d+.*/, "");
    let count: number | undefined = prefixCounts[pfx];
    prefixCounts[pfx] = count == null ? 1 : count + 1;
  }
  for (var pfx in prefixCounts) // Remove prefixes that were only found once
    if (prefixCounts[pfx] == 1)
      delete prefixCounts[pfx];
  return prefixCounts;
}

// Get the constant prefix in each element of a list of strings
export function getSuffix(names: any[]){
  if (names.length <= 1) return "";  // Prevent returning the whole name as a suffix if there's only one
  let terminate = false;
  let suffix = "";
  let reversed = names.map(name => name.split("").reverse().join(""));
  for (let index in reversed[0]){
    let character = reversed[0][index]
    for (let name of reversed){
      if (name[index] != character){
        terminate = true;
        break;
      }
    }
    if (terminate){
      break;
    } else {
      suffix = character + suffix;
    }
  }
  return suffix;
}
  
// Global variables with proper types
const minimumProcessQueryIntervalUnit: number = 100;
const emptyResponseCountsByProcess: Record<string, number | null> = {};
let archivedDataFiles: Record<string, string> = {};

// StringBuffer class implementation
const StringBuffer = function (this: StringBuffer) {
  this.buffer = new Array<string>();
} as unknown as { new (): StringBuffer };

StringBuffer.prototype.append = function (str: string): void {
  this.buffer[this.buffer.length] = str;
};

StringBuffer.prototype.toString = function (): string {
  return this.buffer.join("");
};

// String prototype extension with type safety
declare global {
  interface String {
    endsWith(suffix: string): boolean;
  }
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (suffix: string): boolean {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

// Utility functions with proper type annotations
export function isHex(h: string): boolean {
  const a = parseInt(h, 16);
  return a.toString(16) === h.toLowerCase();
}

export function arrayContains(array: any[], element: any): boolean {
  for (let i = 0; i < array.length; i++) if (array[i] == element) return true;
  return false;
}

export function arrayContainsIgnoreCase(
  array: (string | null)[],
  element: string | null,
): boolean {
  for (let i = 0; i < array.length; i++)
    if (
      (array[i] == null && element == null) ||
      (array[i] != null &&
        element != null &&
        array[i].toLowerCase() == element.toLowerCase())
    )
      return true;
  return false;
}

export function hashCode(s: string | { toString(): string }): number {
  return s
    .toString()
    .split("")
    .reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0);
      return Math.abs(a & a);
    }, 0);
}

export function idLooksGenerated(id: string): boolean {
  const regex = RegExp("^[0-9a-f]+$");
  return id.length == 20 && regex.exec(id) != null;
}

/*export function getProjectId(): string | number {
  return $("#project :selected").data("id") as string;
}*/

export function getModuleName(): string {
  return $("#module").val() as string;
}

// export function to get URL parameters
export function $_GET(param?: string): string | null | Record<string, string> {
  const vars: Record<string, string> = {};
  window.location.href.replace(location.hash, "").replace(
    /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
    function (m, key, value) {
      // callback
      vars[key] = value !== undefined ? value : "";
    },
  );
  if (param) {
    return vars[param] ? vars[param] : null;
  }
  return vars;
}

// Process progress tracking
interface ProgressResponse {
  complete?: boolean;
  aborted?: boolean;
  error?: string;
  progressDescription?: string;
  finalMessage?: string;
}

export async function displayProcessProgress(
  nbMin: number,
  token: string,
  processId: string | null,
  onSuccessMethod: ((finalMessage?: string) => void) | null,
): Promise<void> {
  const functionToCall = async function (
    onSuccessMethod: ((finalMessage?: string) => void) | null,
  ) {
    try {
      const url =
        (window as any).progressUrl +
        (processId != null ? "?progressToken=" + processId : "");
      const response = await axios.get<ProgressResponse | null>(url, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const jsonResult = response.data;
      const processKey = processId != null ? processId : token;

      if (
        jsonResult == null &&
        (typeof (window as any).processAborted == "undefined" ||
          !(window as any).processAborted)
      ) {
        if (emptyResponseCountsByProcess[processKey] == null)
          emptyResponseCountsByProcess[processKey] = 1;
        else emptyResponseCountsByProcess[processKey]++;

        if (emptyResponseCountsByProcess[processKey]! > 10) {
          console.log(
            "Giving up requesting progress for process " + processKey,
          );
          emptyResponseCountsByProcess[processKey] = null;
        } else displayProcessProgress(nbMin, token, processId, onSuccessMethod);
      } else if (jsonResult != null && jsonResult["complete"] == true) {
        if (onSuccessMethod != null)
          onSuccessMethod(jsonResult["finalMessage"]);
        emptyResponseCountsByProcess[processKey] = null;
        $("#progress").modal("hide");
      } else if (jsonResult != null && jsonResult["aborted"] == true) {
        if (typeof (window as any).markCurrentProcessAsAborted != "undefined")
          (window as any).markCurrentProcessAsAborted();
        else (window as any).processAborted = true;
        emptyResponseCountsByProcess[processKey] = null;
        $("#progress").modal("hide");
      } else {
        if (jsonResult != null && jsonResult["error"] != null) {
          alert("Error occurred:\n\n" + jsonResult["error"]);
          $("#progress").data("error", true);
          $("#progress").modal("hide");
          emptyResponseCountsByProcess[processKey] = null;
        } else {
          if (jsonResult != null)
            $("#progressText").html(jsonResult.progressDescription || "");
          displayProcessProgress(nbMin, token, processId, onSuccessMethod);
        }
      }
    } catch (error) {
      handleAxiosError(error);
    }
  };

  setTimeout(
    () => functionToCall(onSuccessMethod),
    minimumProcessQueryIntervalUnit * nbMin,
  );
}

export async function abort(token: string): Promise<void> {
  $("#progressText").html("Aborting...").fadeIn();
  $("#exportPanel").hide();
  $("#progress").data("error", true);

  try {
    const response = await axios.delete((window as any).abortUrl, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const jsonResult = response.data;
    if (jsonResult.processAborted === true) {
      (window as any).processAborted = true;
      $("#progress").modal("hide");
    } else {
      handleError(null, "unable to abort");
    }
  } catch (error) {
    handleAxiosError(error);
  }
}

export function displayMessage(message: string, duration?: number): void {
  duration = duration === undefined ? 5000 : duration;
  $(document.body).append(
    '<div class="alert alert-info alert-dismissable fade in" style="z-index:2000; position:absolute; top:200px; left:' +
      (15 + $("div#searchPanel").width() / 4) +
      'px; min-width:450px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><div id="msg">' +
      message +
      "</div></div>",
  );
  if (duration !== null) {
    window.setTimeout(function () {
      $(".alert").fadeTo(500, 0, function () {
        $(this).remove();
      });
    }, duration);
  }
}

// New export function to handle Axios errors
export function handleAxiosError(error: unknown): void {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401) {
      location.href = "login.do";
      return;
    }

    handleError(null, axiosError.message);

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error data:", axiosError.response.data);
      console.error("Error status:", axiosError.response.status);
      console.error("Error headers:", axiosError.response.headers);
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error("Error request:", axiosError.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", axiosError.message);
    }
  } else {
    // Handle non-Axios errors
    console.error("Unexpected error:", error);
    handleError(null, String(error));
  }
}

// Keeping the original handleError for compatibility
export function handleError(xhr: any | null, thrownError: string | null): void {
  if (xhr != null && xhr.status == 401) {
    location.href = "login.do";
    return;
  }

  let mainMsg: string | null = null;
  let errorMsg: string | null = null;

  if (xhr != null && xhr.status > 0 && xhr.status < 500)
    mainMsg =
      (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) +
      ": " +
      (xhr.responseText == "" ? thrownError : xhr.responseText);
  else {
    mainMsg =
      xhr != null
        ? "Request Status: " + xhr.status
        : thrownError != null
          ? thrownError
          : "";
    if (xhr != null && xhr.responseText != null) {
      try {
        errorMsg =
          (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) +
          ": " +
          JSON.parse(xhr.responseText)["errorMsg"];
      } catch (err) {
        errorMsg =
          (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) +
          ": " +
          xhr.responseText;
      }
    }
  }

  alert(mainMsg + ": " + errorMsg);
  /*
  $(document.body).append('<div class="alert alert-warning alert-dismissable fade in" style="z-index:2000; position:absolute; top:53px; left:10%; min-width:400px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>An error occured!</strong><div id="msg">' + mainMsg + " " + (errorMsg != null ? "<button style='float:right; margin-top:-20px;' onclick='$(this).next().show(200); $(this).remove();'>Click for technical details</button><pre style='display:none; font-size:10px;'>" + errorMsg + "</pre>" : "") + '</div></div>');
  window.setTimeout(function() {
    $(".alert").fadeTo(500, 0, function() {
      $(this).remove(); 
    });
  }, 5000);
  $('div.modal').modal('hide');
  */
}

// Array intersection utility
const arrayIntersection = function <T>(...arrays: T[][]): T[] {
  return Array.from(arrays).reduce(function (previous, current) {
    return previous.filter(function (element) {
      return current.indexOf(element) > -1;
    });
  });
};

export function isNumberKey(evt: KeyboardEvent): boolean {
  const charCode = evt.which ? evt.which : evt.keyCode;
  if (
    charCode > 31 &&
    (charCode < 48 || charCode > 57) &&
    charCode !== 39 &&
    charCode !== 37
  ) {
    return false;
  }
  return true;
}

export async function getToken(): Promise<void> {
  try {
    const response = await axios.post<{
      token: string;
      msg?: string;
      redirect?: string;
    }>(
      (window as any).tokenURL,
      {},
      {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
      },
    );

    const jsonResult = response.data;
    (window as any).token = jsonResult.token;

    if (document.referrer.endsWith("/login.do")) {
      if (jsonResult.msg != null) alert(jsonResult.msg);
      if (jsonResult.redirect != null)
        window.location.href = jsonResult.redirect;
    }
  } catch (error) {
    handleAxiosError(error);
  }
}

// Clear user token
export async function clearToken(): Promise<void> {
  try {
    await axios.delete((window as any).clearTokenURL, {
      headers: {
        Authorization: "Bearer " + (window as any).token,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status !== 0) {
      handleAxiosError(error);
    }
  }
}

export function containsHtmlTags(xStr: string): boolean {
  return xStr != xStr.replace(/<\/?[^>]+>/gi, "");
}

export function buildHeader(
  token: string,
  assemblyId?: string | null,
  individuals?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = { Authorization: "Bearer " + token };
  if (assemblyId != null) headers["assembly"] = assemblyId;
  if (individuals != null) headers["ind"] = individuals;
  return headers;
}

interface OutputToolConfig {
  url?: string;
  formats?: string;
  [key: string]: any;
}

export async function showServerExportBox(
  keepExportOnServer: boolean,
  exportFormatExtensions?: string[],
): Promise<void> {
  $("div#exportPanel").hide();
  $("a#exportBoxToggleButton").removeClass("active");
  if ((window as any).processAborted || (window as any).downloadURL == null)
    return;

  const fileName = (window as any).downloadURL.substring(
    (window as any).downloadURL.lastIndexOf("/") + 1,
  );
  $("#serverExportBox")
    .html(
      '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="float:right;" onclick="$(\'#serverExportBox\').hide();">x&nbsp;</button></button>&nbsp;Export file will be available at this URL for ' +
        (!keepExportOnServer ? 1 : 48) +
        'h:<br/><a id="exportOutputUrl" download href="' +
        (window as any).downloadURL +
        '">' +
        fileName +
        "</a><br/><br/>",
    )
    .show();

  const exportedFormat = $("#exportFormat").val().toString().toUpperCase();
  if ("VCF" == exportedFormat) await addIgvExportIfRunning();
  else if ("FLAPJACK" == exportedFormat) addFjBytesExport();

  $("#serverExportBox").append("<div id='galaxyPushButton' />");

  archivedDataFiles = {};

  if (exportFormatExtensions == null) {
    exportFormatExtensions = $("#exportFormat option:selected")
      .data("ext")
      .split(";");
    if (
      $("#exportPanel input#exportedIndividualMetadataCheckBox").is(
        ":checked",
      ) &&
      "FLAPJACK" != $("#exportFormat").val() &&
      "DARWIN" != $("#exportFormat").val()
    )
      exportFormatExtensions.push("tsv");
  }

  for (const key in exportFormatExtensions)
    archivedDataFiles[exportFormatExtensions[key]] =
      location.origin +
      (window as any).downloadURL.replace(
        new RegExp(/\.[^.]*$/),
        "." + exportFormatExtensions[key],
      );

  const galaxyInstanceUrl = $("#galaxyInstanceURL").val().toString().trim();
  if (galaxyInstanceUrl.startsWith("http")) {
    let fileURLs = "";
    for (const key in archivedDataFiles)
      fileURLs +=
        (fileURLs == "" ? "" : " ,") + "'" + archivedDataFiles[key] + "'";
    $("#galaxyPushButton").html(
      '<div style="display:inline; width:70px; font-weight:bold; background-color:#333333; color:white; border-radius:3px; padding:7px;"><img alt="Galaxy" height="15" src="images/logo-galaxy.png" /> Galaxy</div>&nbsp;<input style="margin-bottom:20px;" type="button" value="Send exported data to ' +
        galaxyInstanceUrl +
        '" onclick="sendToGalaxy([' +
        fileURLs +
        ']);" /><br/>',
    );
    $("#galaxyPushButton").show();
  } else $("#galaxyPushButton").hide();

  if ((window as any).onlineOutputTools != null) {
    for (const toolName in (window as any).onlineOutputTools) {
      const toolConfig = getOutputToolConfig(toolName);
      if (
        toolConfig["url"] != null &&
        toolConfig["url"].trim() != "" &&
        (toolConfig["formats"] == null ||
          toolConfig["formats"].trim() == "" ||
          toolConfig["formats"]
            .toUpperCase()
            .split(",")
            .includes($("#exportFormat").val().toString().toUpperCase()))
      ) {
        let formatsForThisButton = "",
          urlForThisButton = toolConfig["url"];
        const matchResult = urlForThisButton.match(/{([^}]+)}/g);
        if (matchResult != null) {
          const placeHolders = matchResult.map((res) =>
            res.replace(/{|}/g, ""),
          );
          phLoop: for (const i in placeHolders) {
            const phFormats = placeHolders[i].split("|");
            for (const j in phFormats) {
              for (const key in archivedDataFiles) {
                if (key == phFormats[j]) {
                  formatsForThisButton +=
                    (formatsForThisButton == "" ? "" : ", ") + key;
                  urlForThisButton = urlForThisButton.replace(
                    "{" + placeHolders[i] + "}",
                    archivedDataFiles[key],
                  );
                  continue phLoop;
                }
              }
            }
            console.log("unused param: " + placeHolders[i]);
            urlForThisButton = urlForThisButton.replace(
              "{" + placeHolders[i] + "}",
              "",
            );
          }
        }

        if (
          urlForThisButton == toolConfig["url"] &&
          urlForThisButton.indexOf("*") != -1
        ) {
          urlForThisButton = urlForThisButton.replace(
            "*",
            Object.values(archivedDataFiles).join(","),
          );
          formatsForThisButton = Object.keys(archivedDataFiles).join(", ");
        }

        if (formatsForThisButton != "")
          $("#serverExportBox").append(
            '<input style="margin-bottom:20px;" type="button" value="Send ' +
              formatsForThisButton +
              " file(s) to " +
              toolName +
              '" onclick="window.open(\'' +
              urlForThisButton +
              "');\" /><br/>",
          );
      }
    }
  }
}

export function getOutputToolConfig(toolName: string): OutputToolConfig {
  const storedToolConfig = localStorage.getItem("outputTool_" + toolName);
  return storedToolConfig != null
    ? JSON.parse(storedToolConfig)
    : (window as any).onlineOutputTools[toolName];
}

export async function addIgvExportIfRunning(): Promise<void> {
  if ((window as any).igvDataLoadPort == null) return;

  let igvGenomeOptions: string | null = null;

  try {
    const response = await axios.get<string>(
      `http://127.0.0.1:${(window as any).igvDataLoadPort}`,
    );
    const jsonResult = response.data;

    if ("ERROR Unknown command: /" == jsonResult) {
      if (igvGenomeOptions == null) {
        try {
          const genomeListResponse = await axios.get<string>(
            (window as any).igvGenomeListUrl,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          const genomeListText = genomeListResponse.data;
          igvGenomeOptions = "<option>&nbsp;</option>";

          if (genomeListText != null) {
            const genomeLines = genomeListText.split("\n");
            for (let i = 0; i < genomeLines.length; i++)
              if (i > 0 || !genomeLines[i].startsWith("<")) {
                const genomeFields = genomeLines[i].split("\t");
                if (genomeFields.length == 3)
                  igvGenomeOptions +=
                    "<option value='" +
                    genomeFields[2] +
                    "'>" +
                    genomeFields[0] +
                    "</option>";
              }
          }

          $("div#serverExportBox").append(
            "<center><table style='margin-bottom:20px;'><tr><th valign='middle'>View in IGV within genomic/structural context&nbsp;</th></tr><tr><td align='center'><select id='igvGenome' style='min-width:175px;'>" +
              igvGenomeOptions +
              "</select><br/>(you may select a genome to switch to)</td><td valign='top'>&nbsp;<input type='button' value='Send' onclick='sendToIGV();'/></td></tr></table></center>",
          );
        } catch (error) {
          console.error("Error fetching genome list:", error);
        }
      }
    }
  } catch (error) {
    console.log("Unable to find IGV instance");
  }
}

export function addFjBytesExport(): void {
  $("div#serverExportBox").append(
    "<input style='margin-bottom:20px;' type='button' value='View in Flapjack-Bytes' onclick='sendToFjBytes();'/>" +
      ((window as any).exportedIndividualCount * (window as any).count >
      500000000
        ? "<div class='text-red margin-top'>WARNING: Exported dataset potentially contains more than 500 million genotypes.<br/>A standard workstation's web-browser may be unable to load it in with Flapjack-Bytes </div>"
        : "") +
      "<br/>",
  );
}

export async function sendToGalaxy(archivedDataFiles: string[]): Promise<void> {
  const galaxyInstanceUrl = $("#galaxyInstanceURL").val().toString().trim();
  let apiKey = sessionStorage.getItem("galaxyApiKey::" + galaxyInstanceUrl);

  if (apiKey == null)
    apiKey = prompt(
      "Enter the API key tied to your account on\n" + galaxyInstanceUrl,
    );

  if (apiKey != null && apiKey.trim() != "") {
    sessionStorage.setItem("galaxyApiKey::" + galaxyInstanceUrl, apiKey);
    $("#progressText").html("Pushing files to " + galaxyInstanceUrl + " ...");
    $("#asyncProgressButton").hide();
    $("button#abort").hide();
    $("#progress").modal({
      backdrop: "static",
      keyboard: false,
      show: true,
    });

    setTimeout(async function () {
      let n = 0,
        responseMsg = null;

      for (const fileUrl of archivedDataFiles) {
        try {
          const response = await axios.get<string>(
            `${(window as any).galaxyPushURL}?galaxyUrl=${galaxyInstanceUrl}&galaxyApiKey=${apiKey}&fileUrl=${fileUrl}`,
          );
          responseMsg = response.data;
          n++;
        } catch (error) {
          $("#progress").modal("hide");

          if (axios.isAxiosError(error) && error.response?.status === 403) {
            console.log("Removing invalid Galaxy API key: " + apiKey);
            sessionStorage.removeItem("galaxyApiKey::" + galaxyInstanceUrl);
          }

          if (axios.isAxiosError(error) && !error.response) {
            alert("Error accessing resource: " + (window as any).genomeURL);
          } else {
            handleAxiosError(error);
          }
        }
      }

      if (n > 0)
        if (
          confirm(
            n +
              " file(s) " +
              responseMsg +
              "\nOpen a window pointing to that Galaxy instance?",
          )
        )
          window.open(galaxyInstanceUrl);

      $("#progress").modal("hide");
    }, 1);
  }
}

export function sendToFjBytes(): void {
  const url =
    "fjbytes.html?m=" +
    location.origin +
    $("a#exportOutputUrl")
      .attr("href")!
      .replace(new RegExp(/\.[^.]*$/), ".map") +
    "&g=" +
    location.origin +
    $("a#exportOutputUrl")
      .attr("href")!
      .replace(new RegExp(/\.[^.]*$/), ".genotype") +
    "&p=" +
    location.origin +
    $("a#exportOutputUrl")
      .attr("href")!
      .replace(new RegExp(/\.[^.]*$/), ".phenotype") +
    "&id=" +
    getModuleName();

  if ($("#fjBytesPanel").length == 0) {
    location.href = url;
    return;
  }

  ($("#fjBytesPanel") as any).modal({
    opacity: 80,
    overlayCss: {
      backgroundColor: "#111111",
    },
  });

  $("#fjBytesPanelHeader").html(
    '<center>This is a functionality under development and might not be totally stable. Check <a href="https://github.com/cropgeeks/flapjack-bytes" target="_blank">https://github.com/cropgeeks/flapjack-bytes</a> for information about Flapjack-Bytes.&nbsp;&nbsp;&nbsp;<a href="' +
      url +
      '" onclick="$(\'#fjBytesPanel\').modal(\'hide\');" target="_blank">Open in separate window</a></center>',
  );
  $("#fjBytesFrame").attr("src", url);
}

export async function getConfigParam(pattern: string): Promise<string | undefined> {
  try {
    const response = await axios.get<Record<string, string>>(endpoints.CONFIG_PARAM_URL + "?pattern=" + pattern);
    return response.data[pattern];
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getConfigParams(pattern: string): Promise<Record<string, string> | undefined> {
  try {
    const response = await axios.get<Record<string, string>>(endpoints.CONFIG_PARAM_URL + "?pattern=" + pattern);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function sendToIGV(genomeId?: string): Promise<void> {
  const genomeID = $("select#igvGenome").val() as string;

  try {
    const url = `http://127.0.0.1:${(window as any).igvDataLoadPort}/load?${genomeID != "" ? "genome=" + genomeID + "&" : ""}file=${location.origin}${$(
      "a#exportOutputUrl",
    )
      .attr("href")!
      .replace(new RegExp(/\.[^.]*$/), ".vcf")}`;

    const response = await axios.get<string>(url);
    alert("Variant list was sent to IGV!");
  } catch (error) {
    handleAxiosError(error);
  }
}
