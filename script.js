import * as apikey from "./apikey.js";
/* 남은 일
**보수**
- 페이지네이션 빠르게 넘기면 로딩 길어짐
- 팝업 스크롤 좀 이상함

**추가**
*/

const $searchType = document.querySelector("#searchType");
const $searchText = document.querySelector("#searchText");

const $popUpCon = document.querySelector(".popUp-section");
const $topRateMoviesCon = document.querySelector(".topRateMoviesCon");
const $recentMoviesCon = document.querySelector(".recentMoviesCon");
const $genreMoviesCon = document.querySelector(".genreMoviesCon");

const $genreBtnsCon = document.querySelector(".genreBtnsCon");

const $pagenation1 = document.querySelectorAll(".pagenation")[0];
const $pagenation3 = document.querySelectorAll(".pagenation")[1];

// pagenation위한 변수들
let totMovieNum_sec1 = 0;
let totMovieNum_sec3 = [];
let currPage_sec1 = 1;
let currPage_sec3 = 1;
let g_id = Number(document.querySelector(".genreBtnsCon .active").id);

// 검색어
let searchword = "";

/** local storage 관리 **/
let myNotes = JSON.parse(localStorage.getItem("movieNotes")) || [];

const saveToLocal = () => {
  localStorage.setItem("movieNotes", JSON.stringify(myNotes));
};

// pagenation 첫 생성
function makePagenation(currPage, totMovie, secNum) {
  let pageGroup = Math.ceil(currPage / 5);
  let firstPage = (pageGroup - 1) * 5 + 1;
  let lastPage = Math.min(Math.ceil(totMovie / 12), pageGroup * 5);
  let lastLastPage = Math.ceil(totMovie / 12);

  let $pagenation = $pagenation1;

  if (secNum === 3) {
    $pagenation = $pagenation3;
    lastPage = Math.min(Math.ceil(totMovie / 10), pageGroup * 5);
    lastLastPage = Math.ceil(totMovie / 10);
  } else if (secNum !== 1) {
    console.log("something wrong when calling 'makePagenation()'");
    return;
  }

  $pagenation.innerHTML = "";

  for (let p = firstPage; p <= lastPage; p++) {
    let pageBtn = document.createElement("button");
    if (p === currPage) pageBtn.classList.add("active");
    pageBtn.innerHTML = p;
    $pagenation.appendChild(pageBtn);
  }

  let prevBtn = document.createElement("button");
  prevBtn.innerHTML = "이전";
  if (currPage === 1) prevBtn.classList.add("disabled");
  $pagenation.prepend(prevBtn);
  let pPrevBtn = document.createElement("button");
  pPrevBtn.innerHTML = "이전페이지";
  if (firstPage === 1) pPrevBtn.classList.add("disabled");
  $pagenation.prepend(pPrevBtn);

  let nextBtn = document.createElement("button");
  nextBtn.innerHTML = "다음";
  if (currPage === lastLastPage) nextBtn.classList.add("disabled");
  $pagenation.appendChild(nextBtn);
  let nNextBtn = document.createElement("button");
  nNextBtn.innerHTML = "다음페이지";
  if (lastPage === lastLastPage) nNextBtn.classList.add("disabled");
  $pagenation.appendChild(nNextBtn);
}

// 장르 id 가져오기
let genreMap = [];
const getGenreIds = async () => {
  const res = await fetch(
    `${apikey.apiUrl}/genre/movie/list?api_key=${apikey.auth}&language=ko`
  );
  return await res.json();
};

getGenreIds().then((data) => {
  genreMap = data.genres.reduce((gMap, g) => {
    totMovieNum_sec3[g.id] = 0; // 초기화

    gMap[g.id] = g.name.length < 4 ? g.name : g.name.slice(0, 2);

    return gMap;
  }, {});
  // console.log("genres", genreMap);
});

// 화면에 띄울 영화들 fetch하기
const getTopRatedMovies = async (page) => {
  let url;
  if (searchword.length === 0) {
    url = `${apikey.apiUrl}/movie/top_rated?api_key=${apikey.auth}&page=${page}&language=ko`;
  } else {
    url = `${apikey.apiUrl}/search/movie?query=${searchword}&api_key=${apikey.auth}&page=${page}&language=ko`;
  }
  const res = await fetch(url);
  const data = await res.json();
  totMovieNum_sec1 = data.total_results;
  // console.log("total movies (", searchword, ")", totMovieNum_sec1);
  return data;
};

const getRecentMovies = async (page) => {
  const res = await fetch(
    `${apikey.apiUrl}/movie/now_playing?api_key=${apikey.auth}&page=${page}&language=ko`
  );
  const data = await res.json();
  return data;
};

const getGenreMovies = async (page) => {
  const res = await fetch(
    `${apikey.apiUrl}/discover/movie?api_key=${apikey.auth}&with_genres=${g_id}&page=${page}&language=ko`
  );
  const data = await res.json();
  totMovieNum_sec3[g_id] = data.total_results;
  return data;
};

function createComp1(v) {
  const movieTmp = document.createElement("div");
  movieTmp.classList.add("movie");
  movieTmp.setAttribute("id", v.id);
  movieTmp.innerHTML = `
            <div>
              <div>
                <i class="genre">${
                  genreMap[v.genre_ids[0]]
                    ? genreMap[v.genre_ids[0]]
                    : "no-info"
                }</i>
                <i class="title">${v.title}</i>
              </div>
              <i class="language">${v.original_language}</i>
            </div>`;
  movieTmp.prepend(createImg(v));

  return movieTmp;
}

function createComp2(v) {
  const movieTmp = document.createElement("div");
  movieTmp.classList.add("movieWrapper");
  movieTmp.innerHTML = `
            <img class="movie" id="${v.id}" src="${apikey.imgUrl}/w400/${
    v.backdrop_path
  }" alt="" />
            <div>
                <h3>${v.title}</h3>
                <p>${genreMap[v.genre_ids[0]]} / ${genreMap[v.genre_ids[1]]}</p>
                <p>${v.overview}</p>
                <i>${v.original_language}</i>
            </div>`;
  return movieTmp;
}

// bool이 true면 백드롭 이미지, false면 포스터 이미지
function createImg(v, bool = true, idx) {
  const imgTmp = document.createElement("img");
  imgTmp.setAttribute("id", v.id);
  if (bool && v.backdrop_path !== null) {
    imgTmp.setAttribute("src", `${apikey.imgUrl}/w400/${v.backdrop_path}`);
  } else if (v.poster_path !== null) {
    imgTmp.setAttribute("src", `${apikey.imgUrl}/w400/${v.poster_path}`);
  } else {
    imgTmp.setAttribute("alt", "image not found");
  }

  if (!!idx) imgTmp.setAttribute("class", idx);

  return imgTmp;
}

// create sections
function createSec1() {
  $topRateMoviesCon.innerHTML = "";

  let startP = Math.ceil(currPage_sec1 / 5) - 1;
  startP = startP * 3 + 1;

  for (let p = startP; p < startP + 3; p++) {
    getTopRatedMovies(p).then((data) => {
      data.results.forEach((v) => {
        $topRateMoviesCon.appendChild(createComp1(v));
      });

      makePagenation(currPage_sec1, totMovieNum_sec1, 1);
    });
  }
}

let sec2_idx = 0;
function createSec2() {
  if (sec2_idx >= 20) sec2_idx = sec2_idx % 20;
  $recentMoviesCon.innerHTML = "";
  getRecentMovies(1).then((data) => {
    $recentMoviesCon.appendChild(createComp2(data.results[sec2_idx]));
    $recentMoviesCon.appendChild(
      createImg(data.results[(sec2_idx + 1) % 20], true, 1)
    );
    $recentMoviesCon.appendChild(
      createImg(data.results[(sec2_idx + 2) % 20], true, 2)
    );
  });
}

function createSec3() {
  $genreMoviesCon.innerHTML = "";

  let page = Math.ceil(currPage_sec3 / 2);

  getGenreMovies(page).then((data) => {
    data.results.forEach((v) => {
      const imgtmp = createImg(v, false);
      imgtmp.classList.add("movie");
      $genreMoviesCon.appendChild(imgtmp);
    });

    makePagenation(currPage_sec3, totMovieNum_sec3[g_id], 3);
  });
}

createSec1();
createSec2();
createSec3();

// sec3 장르 이동
$genreBtnsCon.addEventListener("click", (e) => {
  const activeGenre = document.querySelector(".genreBtnsCon .active");
  activeGenre.classList.remove("active");

  e.target.classList.add("active");
  g_id = Number(e.target.id);
  createSec3(1);
});

//** pagenation **//
function movePageInner_sec1() {
  let move = currPage_sec1 % 5;
  move = move === 0 ? 4 : move - 1;

  const movies = $topRateMoviesCon.querySelectorAll(".movie");
  movies.forEach((ele) => {
    ele.style.transform = `translateY(calc(-18vw * 3 * ${move}))`;
  });
}
function movePageInner_sec3() {
  let move = (currPage_sec3 + 1) % 2;
  const movies = $genreMoviesCon.querySelectorAll(".movie");
  movies.forEach((ele) => {
    ele.style.transform = `translateY(calc(-54vw * ${move})`;
  });
}

// sec1 pagenation
$pagenation1.addEventListener("click", (e) => {
  if (e.target.classList.contains("disabled")) return;

  let clickedPage = e.target.innerHTML;

  if (!isNaN(clickedPage)) {
    currPage_sec1 = Number(clickedPage);
  } else if (clickedPage === "다음") {
    if (currPage_sec1 % 5 === 0) {
      currPage_sec1++;
      createSec1();
    } else {
      currPage_sec1++;
    }
  } else if (clickedPage === "이전") {
    if (currPage_sec1 % 5 === 1) {
      currPage_sec1--;
      createSec1();
    } else {
      currPage_sec1--;
    }
  } else if (clickedPage === "다음페이지") {
    currPage_sec1 += 5 - (currPage_sec1 % 5) + 1;
    createSec1();
  } else if (clickedPage === "이전페이지") {
    currPage_sec1 -= 5 + (currPage_sec1 % 5) - 1;
    createSec1();
  }
  // console.log("currPage...(sec1)", currPage_sec1);
  makePagenation(currPage_sec1, totMovieNum_sec1, 1);
  movePageInner_sec1();
});

// sec3 pagenation
$pagenation3.addEventListener("click", (e) => {
  if (e.target.classList.contains("disabled")) return;

  let clickedPage = e.target.innerHTML;

  if (!isNaN(clickedPage)) {
    currPage_sec3 = Number(clickedPage);
  } else if (clickedPage === "다음") {
    currPage_sec3++;
  } else if (clickedPage === "이전") {
    currPage_sec3--;
  } else if (clickedPage === "다음페이지") {
    currPage_sec3 += 5 - (currPage_sec3 % 5) + 1;
  } else if (clickedPage === "이전페이지") {
    currPage_sec3 -= 5 + (currPage_sec3 % 5) - 1;
  }
  // console.log("currPage...(sec3)", currPage_sec3);
  makePagenation(currPage_sec3, totMovieNum_sec3[g_id], 3);
  createSec3();

  // MutationObserver 설정
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        movePageInner_sec3(); // 요소가 추가된 후에 함수 실행
        observer.disconnect(); // 작업 완료 후 관찰 중단
      }
    });
  });

  // 관찰할 대상과 옵션 설정
  observer.observe($genreMoviesCon, { childList: true });
});

//** popup **//
function createPopUp(data) {
  document.querySelector(".x").style.display = "inline";

  const wrapper = document.createElement("div");
  wrapper.classList.add("popUp-wrapper");

  // 존재하지 않는 정보는 표시하지 않기
  let tmptxt = "";
  let test = "";
  try {
    test = `
              <p class="genre">${data.genres[0].name} / ${data.genres[1].name}</p>`;
  } catch {
    test = "";
  } finally {
    tmptxt += test;
  }

  try {
    test = `
              <p class="director">감독 : ${
                data.credits.crew[0].name ? data.credits.crew[0].name : ""
              }</p>
              <p class="actor">배우 : ${data.credits.cast[0].name}, ${
      data.credits.cast[1].name
    }</p>
              
              <img class="backdrop" src="${apikey.imgUrl}/w400/${
      data.backdrop_path
    }" alt="">
            </div>`;
  } catch {
    test = "";
  } finally {
    tmptxt += test;
  }

  // 내부 요소 생성
  const inner1 = document.createElement("div");
  inner1.classList.add("upper-popUp");
  inner1.innerHTML =
    `
            <div class="main-poster">
              <img src="${apikey.imgUrl}/w400/${data.poster_path}" alt="" />
            </div>
            <div class="movie-info">
              <p class="starRate"><i class="fa-solid fa-star"></i> ${data.vote_average.toFixed(
                1
              )}</p>
              <h2 class="title">${data.title}</h2>` + tmptxt;

  const inner2 = document.createElement("div");
  inner2.classList.add("lower-popUp");
  if (data.tagline.length !== 0)
    inner2.innerHTML = `
            <p class="line">${data.tagline}</p>
            <p>${data.overview}</p>`;
  else
    inner2.innerHTML = `
            <p>${data.overview}</p>`;

  // 나의 한줄평 생성
  let local = myNotes.find((item) => item.id == data.id);
  const note = document.createElement("div");
  note.classList.add("myNoteWrap");

  const txtarea = document.createElement("textarea");
  txtarea.setAttribute("id", data.id);
  txtarea.setAttribute("class", "myNote");
  txtarea.setAttribute("placeholder", "나의 한줄평");
  txtarea.value = !!local ? local.text : "";
  txtarea.disabled = true;

  const txtbtn = document.createElement("button");
  txtbtn.classList.add("input_saveBtn");
  txtbtn.innerHTML = `<i class="fa-solid fa-pencil"></i>`;

  note.appendChild(txtarea);
  note.appendChild(txtbtn);

  wrapper.appendChild(inner1);
  wrapper.appendChild(inner2);
  wrapper.appendChild(note);

  return wrapper;
}

const popUpMovie = async (m_id) => {
  const res = await fetch(
    `${apikey.apiUrl}/movie/${m_id}?api_key=${apikey.auth}&append_to_response=credits&language=ko`
  );
  const data = await res.json();

  $popUpCon.appendChild(createPopUp(data));
  $popUpCon.style.height = "100vh";
};

// sec1 클릭시 팝업
$topRateMoviesCon.addEventListener("click", (e) => {
  console.log("id=", e.target.closest(".movie").id);
  popUpMovie(e.target.closest(".movie").id);
});
// sec2 클릭시 팝업
$recentMoviesCon.addEventListener("click", (e) => {
  if (!e.target.closest(".movie")) {
    sec2_idx += Number(e.target.classList[0]);
    createSec2();
  } else {
    popUpMovie(e.target.closest(".movie").id);
  }
});
// sec3 클릭시 팝업
$genreMoviesCon.addEventListener("click", (e) => {
  console.log("id=", e.target.id);
  popUpMovie(e.target.id);
});

// 팝업 닫기
document.querySelector(".x").addEventListener("click", (e) => {
  $popUpCon.innerHTML = "";
  $popUpCon.style.height = "0";
  document.querySelector(".x").style.display = "none";
});

/** 팝업 myNote **/
function getInputNote() {
  const $myNote = document.querySelector(".myNote");
  $myNote.disabled = false;
  document.querySelector(
    ".input_saveBtn"
  ).innerHTML = `<i class="fa-regular fa-floppy-disk"></i>`;
}
function saveInputNote() {
  const $myNote = document.querySelector(".myNote");
  const tmpNote = myNotes.find((item) => item.id === $myNote.id);
  if (tmpNote) tmpNote.text = $myNote.value;
  else myNotes.push({ id: $myNote.id, text: $myNote.value });
  saveToLocal();

  $myNote.disabled = true;
  document.querySelector(
    ".input_saveBtn"
  ).innerHTML = `<i class="fa-solid fa-check"></i>`;

  setTimeout(() => {
    document.querySelector(
      ".input_saveBtn"
    ).innerHTML = `<i class="fa-solid fa-pencil"></i>`;
  }, 1000);
}

// myNote 버튼 이벤트
$popUpCon.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("input_saveBtn") ||
    e.target.parentNode.classList.contains("input_saveBtn")
  ) {
    const $myNote = document.querySelector(".myNote");
    if ($myNote.disabled) getInputNote();
    else saveInputNote();
    $myNote.focus();
  }
});

//** 검색 **//
$searchText.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    currPage_sec1 = 1;
    searchword = $searchText.value;
    createSec1();
  }
});
