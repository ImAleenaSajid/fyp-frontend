window.onload = () => {
  const textarea = document.getElementById("essay");
  const wordCountDisplay = document.getElementById("word-count");
  const timerDisplay = document.getElementById("timer");
  const submitBtn = document.getElementById("submit-btn");
  const resultBox = document.getElementById("result-box");
  const resultOutput = document.getElementById("result-output");

  let timeLeft = 3000; // 50 minutes
  let wordCount = 0;
  let satPromptText = '';

  // Load prompt from backend
  fetch('http://127.0.0.1:8000/hello/generate_prompt?test_type=SAT')
    .then(response => response.json())
    .then(data => {
      let prompt = data.prompt || 'Failed to load prompt.'
    // Clean common LLM intro lines if they accidentally appear
      prompt = prompt.split('\n').find(line => /[.?!]$/.test(line.trim())) || prompt;
      satPromptText = prompt;
      document.getElementById('sat-prompt').innerText = prompt;
      // Timer
      const timer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      timeLeft--;
      if (timeLeft < 0) {
      clearInterval(timer);
      alert("Time is up!");
      submitBtn.disabled = true;
    }
    }, 1000);
    })
    .catch(error => {
      console.error('Error fetching SAT prompt:', error);
      document.getElementById('sat-prompt').innerText = 'Error loading prompt.';
    });

  // Word count
  textarea.addEventListener("input", () => {
    const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount = words.length;
    wordCountDisplay.textContent = `Word Count: ${wordCount}`;

    if (wordCount >= 400) {
      submitBtn.disabled = false;
      submitBtn.classList.add("enabled");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.remove("enabled");
    }
  });

 // Submit
submitBtn.addEventListener("click", async () => {
  clearInterval(timer); // ✅ Stop the timer when submit is pressed

  submitBtn.disabled = true;
  submitBtn.classList.remove("enabled");

  const essay = textarea.value.trim();
  resultBox.style.display = "block";
  window.scrollTo(0, 0);
  resultOutput.textContent = "Evaluating... Please wait.";

  console.log("Essay being submitted:", essay);
  console.log("Prompt being submitted:", satPromptText);

  try {
    const response = await fetch("/send-essay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        essay,
        test_type: "SAT",
        prompt: satPromptText  // ✅ Include the stored SAT prompt
      })
    });

    const data = await response.json();
    let output = data.evaluation;

    // ✅ Clean the evaluation result to only show the main SAT block
    let cleaned = output.match(
      /Thesis:.*?Suggestion for Improvement:\s*(?:-|\*) .*?(?=\n{2,}|$)/s
    );

    cleaned = cleaned ? cleaned[0].trim() : output;

    // ✅ Remove leading * or - from bullets
    cleaned = cleaned.replace(/^[\*\-]\s*/gm, '• ');

    // ✅ Bold SAT section headings
    cleaned = cleaned.replace(
      /^(Command of Evidence|Focus and Coherence|Style and Formal Tone|Grammar and Usage|Vocabulary & Sentence Variety|Total Score|Feedback|Feedback on Mistakes|Suggestions for Improvement|Suggestion for Improvement|Improvement suggestions:):/gm,
      '<strong>$1:</strong>'
    );

    // ✅ Display result with formatting
    resultOutput.innerHTML = cleaned;

  } catch (error) {
    resultOutput.textContent = "An error occurred while evaluating the essay.";
  }
});
};
