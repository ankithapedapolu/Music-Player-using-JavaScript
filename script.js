/* =========================================================
   AURA MUSIC PLAYER — SCRIPT
   Vanilla JS. Sections:
   1. Sample playlist data
   2. State + DOM refs
   3. Rendering the playlist
   4. Core playback (load/play/pause/next/prev)
   5. Progress bar + time display
   6. Volume + mute
   7. Shuffle / Repeat
   8. Favorites / Search / Tabs / Recently played
   9. Keyboard shortcuts
   10. LocalStorage persistence
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- 1. SAMPLE PLAYLIST ----------
     Using freely streamable demo tracks (SoundHelix) so
     playback works out of the box. Swap `src` for your own
     hosted MP3s in production. */
  const songs = [
    {
      id: 1,
      title: "Midnight Skyline",
      artist: "Nova Sound",
      cover: "https://picsum.photos/seed/aura1/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: 2,
      title: "Electric Bloom",
      artist: "Kiro Waves",
      cover: "https://picsum.photos/seed/aura2/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: 3,
      title: "Glass Horizon",
      artist: "Delta Youth",
      cover: "https://picsum.photos/seed/aura3/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: 4,
      title: "Paper Moon",
      artist: "Nova Sound",
      cover: "https://picsum.photos/seed/aura4/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: 5,
      title: "Static Bloom",
      artist: "Reef & Isle",
      cover: "https://picsum.photos/seed/aura5/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
      id: 6,
      title: "Velvet Orbit",
      artist: "Kiro Waves",
      cover: "https://picsum.photos/seed/aura6/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: 7,
      title: "Low Tide",
      artist: "Delta Youth",
      cover: "https://picsum.photos/seed/aura7/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    },
    {
      id: 8,
      title: "Afterglow",
      artist: "Reef & Isle",
      cover: "https://picsum.photos/seed/aura8/500/500",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
  ];

  /* ---------- 2. STATE + DOM REFS ---------- */
  const audio = document.getElementById("audio");

  const state = {
    currentIndex: 0,
    isPlaying: false,
    isShuffled: false,
    repeatMode: "off", // 'off' | 'all' | 'one'
    favorites: [],
    recentlyPlayed: [],
    activeTab: "all",
    searchTerm: "",
    shuffleOrder: [],
  };

  const el = {
    bgBlur: document.getElementById("bgBlur"),
    coverImg: document.getElementById("coverImg"),
    coverDisc: document.getElementById("coverDisc"),
    coverArm: document.getElementById("coverArm"),
    trackTitle: document.getElementById("trackTitle"),
    trackArtist: document.getElementById("trackArtist"),
    favBtn: document.getElementById("favBtn"),

    currentTime: document.getElementById("currentTime"),
    durationTime: document.getElementById("durationTime"),
    progressBar: document.getElementById("progressBar"),
    progressFill: document.getElementById("progressFill"),
    progressHandle: document.getElementById("progressHandle"),

    shuffleBtn: document.getElementById("shuffleBtn"),
    prevBtn: document.getElementById("prevBtn"),
    playBtn: document.getElementById("playBtn"),
    playIcon: document.getElementById("playIcon"),
    nextBtn: document.getElementById("nextBtn"),
    repeatBtn: document.getElementById("repeatBtn"),
    repeatOneDot: document.getElementById("repeatOneDot"),

    muteBtn: document.getElementById("muteBtn"),
    volIcon: document.getElementById("volIcon"),
    volumeBar: document.getElementById("volumeBar"),
    volumeFill: document.getElementById("volumeFill"),
    volumeHandle: document.getElementById("volumeHandle"),

    searchInput: document.getElementById("searchInput"),
    tabButtons: document.querySelectorAll(".tab-btn"),
    playlistList: document.getElementById("playlistList"),
  };

  /* ---------- HELPERS ---------- */
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getCurrentSong() {
    return songs[state.currentIndex];
  }

  /* ---------- 3. RENDER PLAYLIST ---------- */
  function getFilteredSongs() {
    let list = songs;

    if (state.activeTab === "favorites") {
      list = list.filter((s) => state.favorites.includes(s.id));
    } else if (state.activeTab === "recent") {
      list = state.recentlyPlayed
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean);
    }

    if (state.searchTerm.trim()) {
      const term = state.searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.artist.toLowerCase().includes(term)
      );
    }

    return list;
  }

  function renderPlaylist() {
    const list = getFilteredSongs();
    el.playlistList.innerHTML = "";

    if (list.length === 0) {
      const empty = document.createElement("li");
      empty.className = "playlist__empty";
      empty.textContent =
        state.activeTab === "favorites"
          ? "No favorites yet — tap the heart on a song to add one."
          : state.activeTab === "recent"
          ? "Nothing played yet."
          : "No songs match your search.";
      el.playlistList.appendChild(empty);
      return;
    }

    list.forEach((song) => {
      const isPlaying = song.id === getCurrentSong().id;
      const isFav = state.favorites.includes(song.id);

      const li = document.createElement("li");
      li.className = "song-item" + (isPlaying ? " is-playing" : "");
      li.dataset.songId = song.id;

      li.innerHTML = `
        <div class="song-item__thumb">
          <img src="${song.cover}" alt="${song.title} cover">
          <div class="song-item__eq"><span></span><span></span><span></span></div>
        </div>
        <div class="song-item__info">
          <p class="song-item__title">${song.title}</p>
          <p class="song-item__artist">${song.artist}</p>
        </div>
        <button class="song-item__fav ${isFav ? "is-fav" : ""}" aria-label="Toggle favorite">
          <i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i>
        </button>
      `;

      li.addEventListener("click", (e) => {
        if (e.target.closest(".song-item__fav")) return;
        const index = songs.findIndex((s) => s.id === song.id);
        loadSong(index, true);
      });

      li.querySelector(".song-item__fav").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(song.id);
      });

      el.playlistList.appendChild(li);
    });
  }

  /* ---------- 4. CORE PLAYBACK ---------- */
  function loadSong(index, autoplay = false) {
    state.currentIndex = index;
    const song = getCurrentSong();

    audio.src = song.src;
    el.coverImg.src = song.cover;
    el.bgBlur.style.backgroundImage = `url("${song.cover}")`;
    el.trackTitle.textContent = song.title;
    el.trackArtist.textContent = song.artist;
    updateFavIcon();

    addToRecentlyPlayed(song.id);
    renderPlaylist();
    saveState();

    if (autoplay) {
      playSong();
    } else {
      pauseSong();
    }
  }

  function playSong() {
    audio.play().catch(() => {
      /* Autoplay may be blocked until user interacts — safe to ignore */
    });
    state.isPlaying = true;
    el.playIcon.classList.remove("fa-play");
    el.playIcon.classList.add("fa-pause");
    el.coverDisc.classList.add("is-spinning");
    el.coverArm.classList.add("is-active");
  }

  function pauseSong() {
    audio.pause();
    state.isPlaying = false;
    el.playIcon.classList.remove("fa-pause");
    el.playIcon.classList.add("fa-play");
    el.coverDisc.classList.remove("is-spinning");
    el.coverArm.classList.remove("is-active");
  }

  function togglePlay() {
    state.isPlaying ? pauseSong() : playSong();
  }

  function getNextIndex() {
    if (state.isShuffled) {
      const pos = state.shuffleOrder.indexOf(state.currentIndex);
      return state.shuffleOrder[(pos + 1) % state.shuffleOrder.length];
    }
    return (state.currentIndex + 1) % songs.length;
  }

  function getPrevIndex() {
    if (state.isShuffled) {
      const pos = state.shuffleOrder.indexOf(state.currentIndex);
      return state.shuffleOrder[(pos - 1 + state.shuffleOrder.length) % state.shuffleOrder.length];
    }
    return (state.currentIndex - 1 + songs.length) % songs.length;
  }

  function nextSong() {
    loadSong(getNextIndex(), true);
  }

  function prevSong() {
    // If more than 3s in, restart current song instead of going back (common UX)
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadSong(getPrevIndex(), true);
  }

  function handleSongEnd() {
    if (state.repeatMode === "one") {
      audio.currentTime = 0;
      playSong();
    } else if (state.repeatMode === "off" && !state.isShuffled && state.currentIndex === songs.length - 1) {
      pauseSong();
      audio.currentTime = 0;
    } else {
      nextSong();
    }
  }

  el.playBtn.addEventListener("click", togglePlay);
  el.nextBtn.addEventListener("click", nextSong);
  el.prevBtn.addEventListener("click", prevSong);
  audio.addEventListener("ended", handleSongEnd);

  /* ---------- 5. PROGRESS BAR ---------- */
  audio.addEventListener("loadedmetadata", () => {
    el.durationTime.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    el.progressFill.style.width = pct + "%";
    el.progressHandle.style.left = pct + "%";
    el.currentTime.textContent = formatTime(audio.currentTime);
    el.durationTime.textContent = formatTime(audio.duration - audio.currentTime); // remaining time
  });

  function seek(e) {
    const rect = el.progressBar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (audio.duration) {
      audio.currentTime = pct * audio.duration;
    }
  }

  let isSeeking = false;
  el.progressBar.addEventListener("mousedown", (e) => { isSeeking = true; seek(e); });
  window.addEventListener("mousemove", (e) => { if (isSeeking) seek(e); });
  window.addEventListener("mouseup", () => { isSeeking = false; });
  el.progressBar.addEventListener("touchstart", (e) => { isSeeking = true; seek(e); });
  window.addEventListener("touchmove", (e) => { if (isSeeking) seek(e); });
  window.addEventListener("touchend", () => { isSeeking = false; });

  /* ---------- 6. VOLUME + MUTE ---------- */
  function setVolume(vol) {
    vol = Math.min(Math.max(vol, 0), 1);
    audio.volume = vol;
    audio.muted = vol === 0;
    el.volumeFill.style.width = vol * 100 + "%";
    el.volumeHandle.style.left = vol * 100 + "%";
    updateVolumeIcon(vol);
    saveState();
  }

  function updateVolumeIcon(vol) {
    el.volIcon.className =
      vol === 0 ? "fa-solid fa-volume-xmark"
      : vol < 0.5 ? "fa-solid fa-volume-low"
      : "fa-solid fa-volume-high";
  }

  function seekVolume(e) {
    const rect = el.volumeBar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setVolume(pct);
  }

  let isVolDragging = false;
  el.volumeBar.addEventListener("mousedown", (e) => { isVolDragging = true; seekVolume(e); });
  window.addEventListener("mousemove", (e) => { if (isVolDragging) seekVolume(e); });
  window.addEventListener("mouseup", () => { isVolDragging = false; });
  el.volumeBar.addEventListener("touchstart", (e) => { isVolDragging = true; seekVolume(e); });
  window.addEventListener("touchmove", (e) => { if (isVolDragging) seekVolume(e); });
  window.addEventListener("touchend", () => { isVolDragging = false; });

  let volumeBeforeMute = 0.7;
  el.muteBtn.addEventListener("click", () => {
    if (audio.volume > 0) {
      volumeBeforeMute = audio.volume;
      setVolume(0);
    } else {
      setVolume(volumeBeforeMute || 0.7);
    }
  });

  /* ---------- 7. SHUFFLE / REPEAT ---------- */
  function buildShuffleOrder() {
    const order = songs.map((_, i) => i).filter((i) => i !== state.currentIndex);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return [state.currentIndex, ...order];
  }

  el.shuffleBtn.addEventListener("click", () => {
    state.isShuffled = !state.isShuffled;
    el.shuffleBtn.classList.toggle("is-active", state.isShuffled);
    if (state.isShuffled) {
      state.shuffleOrder = buildShuffleOrder();
    }
    saveState();
  });

  el.repeatBtn.addEventListener("click", () => {
    const modes = ["off", "all", "one"];
    const next = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    state.repeatMode = next;

    el.repeatBtn.classList.toggle("is-active", next !== "off");
    el.repeatOneDot.classList.toggle("is-visible", next === "one");
    saveState();
  });

  /* ---------- 8. FAVORITES / SEARCH / TABS / RECENT ---------- */
  function toggleFavorite(songId) {
    const idx = state.favorites.indexOf(songId);
    if (idx === -1) {
      state.favorites.push(songId);
    } else {
      state.favorites.splice(idx, 1);
    }
    updateFavIcon();
    renderPlaylist();
    saveState();
  }

  function updateFavIcon() {
    const isFav = state.favorites.includes(getCurrentSong().id);
    el.favBtn.classList.toggle("is-active", isFav);
    el.favBtn.querySelector("i").className = `fa-${isFav ? "solid" : "regular"} fa-heart`;
  }

  el.favBtn.addEventListener("click", () => toggleFavorite(getCurrentSong().id));

  function addToRecentlyPlayed(songId) {
    state.recentlyPlayed = state.recentlyPlayed.filter((id) => id !== songId);
    state.recentlyPlayed.unshift(songId);
    state.recentlyPlayed = state.recentlyPlayed.slice(0, 15);
  }

  el.searchInput.addEventListener("input", (e) => {
    state.searchTerm = e.target.value;
    renderPlaylist();
  });

  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      el.tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeTab = btn.dataset.tab;
      renderPlaylist();
    });
  });

  /* ---------- 9. KEYBOARD SHORTCUTS ---------- */
  document.addEventListener("keydown", (e) => {
    // Ignore shortcuts while typing in the search box
    if (document.activeElement === el.searchInput) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        nextSong();
        break;
      case "ArrowLeft":
        prevSong();
        break;
      case "ArrowUp":
        e.preventDefault();
        setVolume(Math.min(audio.volume + 0.1, 1));
        break;
      case "ArrowDown":
        e.preventDefault();
        setVolume(Math.max(audio.volume - 0.1, 0));
        break;
      case "KeyM":
        el.muteBtn.click();
        break;
      case "KeyR":
        el.repeatBtn.click();
        break;
      case "KeyS":
        el.shuffleBtn.click();
        break;
    }
  });

  /* ---------- 10. LOCALSTORAGE PERSISTENCE ---------- */
  function saveState() {
    try {
      localStorage.setItem(
        "aura-player-state",
        JSON.stringify({
          volume: audio.volume,
          lastSongId: getCurrentSong().id,
          favorites: state.favorites,
          recentlyPlayed: state.recentlyPlayed,
          repeatMode: state.repeatMode,
          isShuffled: state.isShuffled,
        })
      );
    } catch (e) {
      /* localStorage unavailable — fail silently */
    }
  }

  function loadState() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("aura-player-state"));
    } catch (e) {
      saved = null;
    }
    return saved || {};
  }

  /* ---------- INIT ---------- */
  function init() {
    const saved = loadState();

    state.favorites = saved.favorites || [];
    state.recentlyPlayed = saved.recentlyPlayed || [];
    state.repeatMode = saved.repeatMode || "off";
    state.isShuffled = Boolean(saved.isShuffled);

    el.repeatBtn.classList.toggle("is-active", state.repeatMode !== "off");
    el.repeatOneDot.classList.toggle("is-visible", state.repeatMode === "one");
    el.shuffleBtn.classList.toggle("is-active", state.isShuffled);

    const startIndex = saved.lastSongId
      ? Math.max(songs.findIndex((s) => s.id === saved.lastSongId), 0)
      : 0;

    if (state.isShuffled) {
      state.currentIndex = startIndex;
      state.shuffleOrder = buildShuffleOrder();
    }

    loadSong(startIndex, false);
    setVolume(typeof saved.volume === "number" ? saved.volume : 0.7);
    renderPlaylist();
  }

  init();
});
