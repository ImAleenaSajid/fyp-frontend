window.onload = () => {
  const textarea = document.getElementById("ielts-essay");
  const wordCountDisplay = document.getElementById("ielts-word-count");
  const timerDisplay = document.getElementById("ielts-timer");
  const submitBtn = document.getElementById("ielts-submit-btn");
  const resultBox = document.getElementById("ielts-result-box");
  const resultOutput = document.getElementById("ielts-result-output");
  const promptDisplay = document.getElementById("ielts-prompt");

  let timeLeft = 2400; // 40 minutes
  let timer;
  let ieltsPromptText = '';

  // Load prompt from backend
  // Load prompt from backend
fetch('https://evaluatehub.onrender.com/hello/generate_prompt?test_type=IELTS')
  .then(response => response.json())
  .then(data => {
    let prompt = data.prompt || 'Failed to load prompt.';

    // Clean common LLM intro lines if they accidentally appear
    prompt = prompt.split('\n').find(line => /[.?!]$/.test(line.trim())) || prompt;

    ieltsPromptText = prompt;
    document.getElementById('ielts-prompt').innerText = prompt;
    // Timer
    timer = setInterval(() => {
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
    console.error('Error fetching IELTS prompt:', error);
    document.getElementById('ielts-prompt').innerText = 'Error loading prompt.';
  });


  // Word count
  textarea.addEventListener("input", () => {
    const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    wordCountDisplay.textContent = `Word Count: ${count}`;

    if (count >= 250) {
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
  console.log("Prompt being submitted:", ieltsPromptText);

  try {
    const response = await fetch("/send-essay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        essay,
        test_type: "IELTS",
        prompt: ieltsPromptText  // ✅ Include the stored IELTS prompt
      })
    });

    const data = await response.json();
    let output = data.evaluation;

    // ✅ Clean the evaluation result to only show the main block
    let cleaned = output.match(
    /Task Response:.*?Suggestion for Improvement:\s*(?:-|\*) .*?(?=\n{2,}|$)/s
    );

    cleaned = cleaned ? cleaned[0].trim() : output;

    // ✅ Remove leading * or - from bullets
    cleaned = cleaned.replace(/^[\*\-]\s*/gm, '• ');

    // ✅ Optional: Bold section headings
    cleaned = cleaned.replace(
    /^(Task Response|Coherence and Cohesion|Lexical Resource|Grammatical Range and Accuracy|Overall Band Score|Feedback|Feedback on Mistakes|Suggestion for Improvement|Suggestions for Improvement|Improvement suggestions:):/gm,
    '<strong>$1:</strong>'
    );

// ✅ Display result with formatting
    resultOutput.innerHTML = cleaned;


  } catch (error) {
    resultOutput.textContent = "An error occurred while evaluating the essay.";
  }
});

};
