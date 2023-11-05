import { useEffect, useState } from "react";
import "./App.css";
import { manipulate } from "./llm-syntax";

interface Optimizations {
  title: string;
  description: string;
}

const css = `
.animate-scan::after {
  content: "";
  position: absolute;
  top:0;
  left:0;
  bottom: 0;
  right:0;
  height: 2rem;
  background: #2D2D2D;
  width: 100vw;
  box-shadow: 0 0 70px 15px hsl(var(--primary));
  animation: scan 1.5s ease-in-out infinite alternate;
  z-index: 2147483647;
}

.animate-scan{
  display:sticky;
  top:0;
  left:0;
  bottom: 0;
  right:0;
}


@keyframes scan {
  100% {
    transform: 'translateY(-100%)';
    top: 100%
  }
}
`;

function App() {
  const [goal, setGoal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [pageUrl, setPageUrl] = useState<string>("");
  const [pageTitle, setPageTitle] = useState<string>("");
  const [optimizations, setOptimizations] = useState<Optimizations[]>([]);

  useEffect(() => {
    // start getting the html content
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setPageUrl(tabs[0].url || "");
      setPageTitle(tabs[0].title || "");

      chrome.scripting.insertCSS({
        target: { tabId: tabs[0].id || 0 },
        css: css,
      });

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id || 0 },
        func: manipulate,
      });
    });

    // receive the html content
    chrome.runtime.onMessage.addListener(function (request) {
      if (request?.llm_syntax) setHtmlContent(request.llm_syntax);
      if (request?.html_parsing_error) setHasError(true);
    });
  }, []);

  useEffect(() => {
    toggleScan(loading);
  }, [loading]);

  const toggleScan = (show: boolean) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id || 0 },
        args: [show],
        func: (showIt: boolean) => {
          if (showIt) {
            // scroll to top
            window.scrollTo(0, 0);
            const scanner = document.createElement("div");
            scanner.classList.add("animate-scan");
            document.body.appendChild(scanner);
          } else {
            const scanner = document.querySelector(".animate-scan");
            scanner?.remove();
          }
        },
      });
    });
  };

  const onSubmit = () => {
    setLoading(true);

    fetch("http://localhost/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal,
        htmlContent,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setOptimizations(data);
        setLoading(false);
      })
      .catch((error) => {
        setHasError(true);
        setLoading(false);
      });
  };

  const downloadFile = () => {
    const filename = `Optimization Advice for by UXcelerate.txt`;
    let docContent =
      `*Optimization Advice for ${pageTitle}* \n${pageUrl}\n\n` +
      optimizations
        .map(
          (optimization) =>
            `*${optimization.title}* \n ${optimization.description}`
        )
        .join("\n\n");
    let doc = URL.createObjectURL(
      new Blob([docContent], { type: "application/text" })
    );

    chrome.downloads.download({
      url: doc,
      filename: filename,
      conflictAction: "overwrite",
      saveAs: true,
    });
  };

  return (
    <div className="App">
      <h1 className="icon">😎</h1>
      <h1 className="logo">UXcelarate</h1>

      {!optimizations.length && (
        <div className="input-container">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            type="text"
            placeholder="taxpayers should understand the process clearly and be able to pay there taxes in time"
          />
          <button disabled={loading || !htmlContent} onClick={onSubmit}>
            {loading ? "Loading" : "Get Inspired"}
          </button>

          {hasError && (
            <span className="error">
              There was an error please refresh the page and try again
            </span>
          )}
        </div>
      )}

      {!loading && optimizations && (
        <div className="optimization-container">
          {optimizations.map((optimization) => (
            <OptimizationItem
              key={optimization.title}
              title={optimization.title}
              description={optimization.description}
              pageUrl={pageUrl}
              pageTitle={pageTitle}
            />
          ))}
          {optimizations.length > 0 && (
            <div className="download-container">
              <button onClick={downloadFile}>Download all Optimizations</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type OptimizationItemProps = {
  title: string;
  description: string;
  pageUrl: string;
  pageTitle: string;
};

function OptimizationItem({
  title,
  description,
  pageUrl,
  pageTitle,
}: OptimizationItemProps) {
  const [mailTo, setMailTo] = useState<string>("");

  useEffect(() => {
    setMailTo(
      `mailto:?subject=Optimization%20advice%20for%20${pageTitle}&body=Here%20is%20the%20optimization%20advice%20I%20came%20up%20using%20UXcelerate:%0D%20${title}%0D%20${description}%0Durl:%20${pageUrl}`
    );
  }, [pageUrl, pageTitle]);

  return (
    <div
      className="optimization-item"
    >
      <div className="text-container">
        <h2 className="title">{title}</h2>
        <p className="description">{description}</p>
      </div>
      <div className="share-container">
        <ShareButton link={mailTo} />
      </div>
    </div>
  );
}

function ShareButton({ link }: { link: string }) {
  return (
    <a href={link} className="share-button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="#5C5C61"
        viewBox="0 0 256 256"
      >
        <path d="m237.66 106.35-80-80A8 8 0 0 0 144 32v40.35c-25.94 2.22-54.59 14.92-78.16 34.91-28.38 24.08-46.05 55.11-49.76 87.37a12 12 0 0 0 20.68 9.58c11-11.71 50.14-48.74 107.24-52V192a8 8 0 0 0 13.66 5.65l80-80a8 8 0 0 0 0-11.3ZM160 172.69V144a8 8 0 0 0-8-8c-28.08 0-55.43 7.33-81.29 21.8a196.17 196.17 0 0 0-36.57 26.52c5.8-23.84 20.42-46.51 42.05-64.86C99.41 99.77 127.75 88 152 88a8 8 0 0 0 8-8V51.32L220.69 112Z"></path>
      </svg>
    </a>
  );
}

export default App;
