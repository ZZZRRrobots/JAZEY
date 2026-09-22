const DURATION = 65;

const scenes = [
    ...document.querySelectorAll(".scene")
];

const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");
const timeline = document.getElementById("timeline");
const currentTime = document.getElementById("currentTime");

let currentTimeValue = 0;
let playing = false;
let muted = false;
let lastFrame = performance.now();
let activeSceneIndex = -1;

const narration = [];
const music = new Audio("audio/music.mp4");

music.loop = true;
music.volume = 0.12;


/* =========================================================
   LOAD 9 NARRATION FILES
========================================================= */

for (let i = 1; i <= 9; i++) {

    const audio = new Audio(`audio/${i}.mp4`);

    audio.preload = "auto";
    audio.volume = 1;

    narration.push(audio);
}


/* =========================================================
   SCENE INFORMATION
========================================================= */

function getSceneIndex(time) {

    for (let i = 0; i < scenes.length; i++) {

        const start = Number(scenes[i].dataset.start);
        const end = Number(scenes[i].dataset.end);

        if (time >= start && time < end) {
            return i;
        }
    }

    return scenes.length - 1;
}


/* =========================================================
   CHANGE SCENE
========================================================= */

function activateScene(index, seekAudio = true) {

    if (index === activeSceneIndex) return;

    activeSceneIndex = index;

    scenes.forEach((scene, i) => {
        scene.classList.toggle("active", i === index);
    });

    narration.forEach((audio, i) => {

        if (i !== index) {
            audio.pause();
        }
    });

    if (seekAudio) {

        const sceneStart =
            Number(scenes[index].dataset.start);

        const localTime =
            Math.max(0, currentTimeValue - sceneStart);

        const audio = narration[index];

        try {
            audio.currentTime = localTime;
        } catch {}

        if (playing && !muted) {
            audio.play().catch(() => {});
        }
    }
}


/* =========================================================
   TIME DISPLAY
========================================================= */

function formatTime(seconds) {

    seconds = Math.max(0, Math.floor(seconds));

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    return `${minutes}:${secs
        .toString()
        .padStart(2, "0")}`;
}


function updateTimeUI() {

    timeline.value = currentTimeValue;

    currentTime.textContent =
        formatTime(currentTimeValue);
}


/* =========================================================
   PLAY
========================================================= */

async function startPlayback() {

    if (currentTimeValue >= DURATION) {
        currentTimeValue = 0;
    }

    playing = true;

    playBtn.textContent = "❚❚";

    if (!muted) {

        music.play().catch(() => {});

        const index =
            getSceneIndex(currentTimeValue);

        const audio =
            narration[index];

        const start =
            Number(scenes[index].dataset.start);

        const local =
            currentTimeValue - start;

        try {
            audio.currentTime = local;
        } catch {}

        audio.play().catch(() => {});
    }
}


function pausePlayback() {

    playing = false;

    playBtn.textContent = "▶";

    music.pause();

    narration.forEach(audio => {
        audio.pause();
    });
}


/* =========================================================
   MAIN LOOP
========================================================= */

function loop(now) {

    const delta =
        (now - lastFrame) / 1000;

    lastFrame = now;

    if (playing) {

        currentTimeValue += delta;

        if (currentTimeValue >= DURATION) {

            currentTimeValue = DURATION;

            pausePlayback();

            activateScene(
                scenes.length - 1,
                false
            );
        }

        const index =
            getSceneIndex(currentTimeValue);

        if (index !== activeSceneIndex) {

            activateScene(
                index,
                true
            );
        }

        updateTimeUI();
    }

    requestAnimationFrame(loop);
}


/* =========================================================
   PLAY BUTTON
========================================================= */

playBtn.addEventListener("click", () => {

    if (playing) {
        pausePlayback();
    } else {
        startPlayback();
    }
});


/* =========================================================
   RESTART
========================================================= */

restartBtn.addEventListener("click", () => {

    pausePlayback();

    currentTimeValue = 0;

    activateScene(0, true);

    updateTimeUI();
});


/* =========================================================
   MUTE
========================================================= */

muteBtn.addEventListener("click", () => {

    muted = !muted;

    if (muted) {

        muteBtn.textContent = "🔇";

        music.pause();

        narration.forEach(audio => {
            audio.pause();
        });

    } else {

        muteBtn.textContent = "🔊";

        if (playing) {

            music.play().catch(() => {});

            const index =
                getSceneIndex(currentTimeValue);

            const start =
                Number(scenes[index].dataset.start);

            const audio =
                narration[index];

            try {
                audio.currentTime =
                    currentTimeValue - start;
            } catch {}

            audio.play().catch(() => {});
        }
    }
});


/* =========================================================
   TIMELINE SEEK
========================================================= */

timeline.addEventListener("input", () => {

    const oldIndex = activeSceneIndex;

    currentTimeValue =
        Number(timeline.value);

    const newIndex =
        getSceneIndex(currentTimeValue);

    if (newIndex !== oldIndex) {

        activateScene(
            newIndex,
            true
        );

    } else {

        const scene =
            scenes[newIndex];

        const start =
            Number(scene.dataset.start);

        const audio =
            narration[newIndex];

        try {
            audio.currentTime =
                Math.max(
                    0,
                    currentTimeValue - start
                );
        } catch {}
    }

    updateTimeUI();
});


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener("keydown", event => {

    if (event.code === "Space") {

        event.preventDefault();

        if (playing) {
            pausePlayback();
        } else {
            startPlayback();
        }
    }

    if (event.key.toLowerCase() === "r") {

        restartBtn.click();
    }

    if (event.key.toLowerCase() === "m") {

        muteBtn.click();
    }

    if (event.key === "ArrowRight") {

        currentTimeValue =
            Math.min(
                DURATION,
                currentTimeValue + 5
            );

        timeline.value =
            currentTimeValue;

        const index =
            getSceneIndex(currentTimeValue);

        activateScene(index, true);

        updateTimeUI();
    }

    if (event.key === "ArrowLeft") {

        currentTimeValue =
            Math.max(
                0,
                currentTimeValue - 5
            );

        timeline.value =
            currentTimeValue;

        const index =
            getSceneIndex(currentTimeValue);

        activateScene(index, true);

        updateTimeUI();
    }
});


/* =========================================================
   AUDIO SAFETY
========================================================= */

narration.forEach(audio => {

    audio.addEventListener("ended", () => {

        if (!playing) return;

        const index =
            narration.indexOf(audio);

        const next =
            index + 1;

        if (next < narration.length) {

            const nextStart =
                Number(scenes[next].dataset.start);

            currentTimeValue =
                nextStart;

            activateScene(
                next,
                true
            );

        }
    });
});


/* =========================================================
   INITIALIZE
========================================================= */

timeline.max = DURATION;

currentTimeValue = 0;

activateScene(0, false);

updateTimeUI();

requestAnimationFrame(loop);
