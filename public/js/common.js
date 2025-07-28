export function startTimer(duration, display) {
  let timer = duration, minutes, seconds;
  const interval = setInterval(() => {
    minutes = Math.floor(timer / 60);
    seconds = timer % 60;

    display.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

    if (--timer < 0) {
      clearInterval(interval);
      alert("Time's up!");
    }
  }, 1000);
}

export function countWords(input, counter) {
  input.addEventListener('input', () => {
    const words = input.value.trim().split(/\s+/).filter(Boolean);
    counter.textContent = words.length;
  });
}
