window.onload = () => {
const issueTextarea = document.getElementById("gre-essay-issue");
const argumentTextarea = document.getElementById("gre-essay-argument");
const issueWordCount = document.getElementById("gre-word-count-issue");
const argumentWordCount = document.getElementById("gre-word-count-argument");
const issueTimer = document.getElementById("gre-timer-issue");
const argumentTimer = document.getElementById("gre-timer-argument");
const submitBtn = document.getElementById("gre-submit-btn");
const doneBtn = document.getElementById("gre-done-btn");
const resultBox = document.getElementById("gre-result-box");
const resultOutput = document.getElementById("gre-result-output");


  let issueTime = 1800;
  let argumentTime = 1800;
  let issueInterval, argumentInterval;

  let issueWords = 0;
  let argumentWords = 0;
  let argumentStarted = false;
  let greIssuePromptText = '';
  let greArgumentPromptText = '';

// Load prompt from backend
  fetch('http://127.0.0.1:8000/hello/generate_prompt?test_type=GRE-ISSUE')
    .then(response => response.json())
    .then(data => {
      let prompt = data.prompt || 'Failed to load prompt.';
      // Clean common LLM intro lines if they accidentally appear
      prompt = prompt.split('\n').find(line => /[.?!]$/.test(line.trim())) || prompt;
      greIssuePromptText = prompt;
      document.getElementById('gre-issue-prompt').innerText = prompt;
    // Start Issue timer immediately
    issueInterval = setInterval(() => {
    const min = Math.floor(issueTime / 60);
    const sec = issueTime % 60;
    issueTimer.textContent = `Time: ${min}:${sec.toString().padStart(2, '0')}`;
    issueTime--;
    if (issueTime < 0) {
      clearInterval(issueInterval);
      alert("Time's up for Issue Essay!");
      if (!argumentStarted) {
        startArgumentTimer();
        doneBtn.disabled = true;
        doneBtn.classList.remove("enabled");
      }
    }
  }, 1000);
  })
    .catch(error => {
      console.error('Error fetching GRE Issue Essay prompt:', error);
      document.getElementById('gre-issue-prompt').innerText = 'Error loading prompt.';
    });

// Load prompt from backend
  fetch('http://127.0.0.1:8000/hello/generate_prompt?test_type=GRE-ARGUMENT')
    .then(response => response.json())
    .then(data => {
      let prompt = data.prompt || 'Failed to load prompt.';
      // Clean common LLM intro lines if they accidentally appear
      prompt = prompt.split('\n').find(line => /[.?!]$/.test(line.trim())) || prompt;
      greArgumentPromptText = prompt;
      document.getElementById('gre-argument-prompt').innerText = prompt;
    })
    .catch(error => {
      console.error('Error fetching GRE Argument Essay prompt:', error);
      document.getElementById('gre-argument-prompt').innerText = 'Error loading prompt.';
    });

  function startArgumentTimer() {
    argumentStarted = true;
    argumentInterval = setInterval(() => {
      const min = Math.floor(argumentTime / 60);
      const sec = argumentTime % 60;
      argumentTimer.textContent = `Time: ${min}:${sec.toString().padStart(2, '0')}`;
      argumentTime--;
      if (argumentTime < 0) {
        clearInterval(argumentInterval);
        alert("Time's up for Argument Essay!");
      }
    }, 1000);
  }

  // Word count handlers
  issueTextarea.addEventListener("input", () => {
    const words = issueTextarea.value.trim().split(/\s+/).filter(w => w.length > 0);
    issueWords = words.length;
    issueWordCount.textContent = `Word Count: ${issueWords}`;
    updateDoneButton();
    updateSubmitButton();
  });

  argumentTextarea.addEventListener("input", () => {
    const words = argumentTextarea.value.trim().split(/\s+/).filter(w => w.length > 0);
    argumentWords = words.length;
    argumentWordCount.textContent = `Word Count: ${argumentWords}`;
    updateSubmitButton();
  });

  function updateDoneButton() {
    if (issueWords >= 500 && !argumentStarted) {
      doneBtn.disabled = false;
      doneBtn.classList.add("enabled");
    } else {
      doneBtn.disabled = true;
      doneBtn.classList.remove("enabled");
    }
  }

  function updateSubmitButton() {
    if (issueWords >= 500 && argumentWords >= 500) {
      submitBtn.disabled = false;
      submitBtn.classList.add("enabled");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.remove("enabled");
    }
  }

  doneBtn.addEventListener("click", () => {
    if (!argumentStarted) {
      clearInterval(issueInterval);
      startArgumentTimer();
      doneBtn.disabled = true;
      doneBtn.classList.remove("enabled");
    }
  });

// Submit
submitBtn.addEventListener("click", async () => {
  clearInterval(issueInterval);
  clearInterval(argumentInterval);

  submitBtn.disabled = true;
  submitBtn.classList.remove("enabled");

  const issueEssay = issueTextarea.value.trim();
  const argumentEssay = argumentTextarea.value.trim();

  const combinedPrompt = `
Prompt 1:
${greIssuePromptText}

Prompt 2:
${greArgumentPromptText}
  `.trim();

  const combinedEssay = `
Essay 1:
${issueEssay}

Essay 2:
${argumentEssay}
  `.trim();

  resultBox.style.display = "block";
  window.scrollTo(0, 0);
  resultOutput.textContent = "Evaluating... Please wait.";

  console.log("Prompt being submitted:", combinedPrompt);
  console.log("Essay being submitted:", combinedEssay);

  try {
    const response = await fetch("/send-essay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        essay: combinedEssay,
        test_type: "GRE",
        prompt: combinedPrompt
      })
    });

    const data = await response.json();
    let output = data.evaluation;

    // ✅ Clean the evaluation result to only show the main GRE block
    let cleaned = output.match(
      /Clarity:.*?Suggestion for Improvement:\s*(?:-|\*) .*?(?=\n{2,}|$)/s
    );

    cleaned = cleaned ? cleaned[0].trim() : output;

    // ✅ Remove leading * or - from bullets
    cleaned = cleaned.replace(/^[\*\-]\s*/gm, '• ');

    // ✅ Bold GRE section headings
    cleaned = cleaned.replace(
      /^(Clarity and Logic of Ideas|Use of Reasoning & Evidence|Organization and Coherence|Grammar and Vocabulary|Total Score|Feedback|Feedback on Mistakes|Suggestion for Improvement|Suggestions for Improvement|Improvement suggestions:):/gm,
      '<strong>$1:</strong>'
    );

    // ✅ Display result with formatting
    resultOutput.innerHTML = cleaned;

  } catch (error) {
    resultOutput.textContent = "An error occurred while evaluating the essay.";
  }
});
};
