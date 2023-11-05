import { useEffect, useState } from "react";
import "./App.css";
import { manipulate } from "./llm-syntax";

interface Optimizations {
  title: string;
  description: string;
}

function App() {
  const [goal, setGoal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [optimizations, setOptimizations] = useState<Optimizations[]>([]);

  useEffect(() => {
    // start getting the html content
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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

  const onSubmit = () => {
    setLoading(true);

    // replace with API call
    setTimeout(() => {
      setLoading(false);
      setOptimizations([
        {
          title: "Optimization 1",
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor.",
        },
        {
          title: "Optimization 2",
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor.",
        },
        {
          title: "Optimization 3",
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="App">
      <h1 className="title">UXcelarate</h1>

      {!optimizations.length && (
        <div className="input-container">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            type="text"
            placeholder="Enter your goal"
          />
          <button disabled={loading || !htmlContent} onClick={onSubmit}>
            {loading ? "Loading" : "Submit"}
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
            <div key={optimization.title} className="optimization-item">
              <h2>{optimization.title}</h2>
              <p>{optimization.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
