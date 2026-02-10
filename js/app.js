(function () {
  "use strict";

  // ===== SVG Icons =====

  var icons = {
    list: '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    grid: '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    titles: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>',
    check: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    play: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    clock: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    empty: '<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  // ===== State =====

  var projects = [];
  var activeFilter = "Всі";
  var activeView = "list";
  var filters = ["Всі", "В процесі", "Завершено", "Заплановано"];

  // ===== DOM =====

  var statsGrid = document.getElementById("statsGrid");
  var overallProgress = document.getElementById("overallProgress");
  var filterTabs = document.getElementById("filterTabs");
  var viewToggle = document.getElementById("viewToggle");
  var projectList = document.getElementById("projectList");

  // ===== Load Data =====

  function loadProjects() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "data/projects.json", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          try {
            projects = JSON.parse(xhr.responseText);
            init();
          } catch (e) {
            projectList.innerHTML = '<div class="empty-state"><p>Помилка парсингу даних</p></div>';
          }
        } else {
          projectList.innerHTML = '<div class="empty-state"><p>Помилка завантаження даних</p></div>';
        }
      }
    };
    xhr.send();
  }

  // ===== Stats =====

  function computeStats() {
    var totalTitles = projects.length;
    var completed = 0;
    var inProgress = 0;
    var episodesDone = 0;
    var episodesTotal = 0;

    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      if (p.status === "Завершено") completed++;
      if (p.status === "В процесі") inProgress++;
      episodesDone += p.episodes;
      episodesTotal += p.episodes_total;
    }

    var overallPercent = episodesTotal > 0 ? Math.round((episodesDone / episodesTotal) * 100) : 0;

    return {
      totalTitles: totalTitles,
      completed: completed,
      inProgress: inProgress,
      episodesDone: episodesDone,
      episodesTotal: episodesTotal,
      overallPercent: overallPercent
    };
  }

  function renderStats(stats) {
    var cards = [
      { icon: icons.titles, value: stats.totalTitles, label: "Тайтлів", cls: "purple" },
      { icon: icons.check, value: stats.completed, label: "Завершено", cls: "green" },
      { icon: icons.play, value: stats.episodesDone, label: "Епізодів", cls: "blue" },
      { icon: icons.clock, value: stats.inProgress, label: "В роботі", cls: "yellow" }
    ];

    statsGrid.innerHTML = "";
    for (var i = 0; i < cards.length; i++) {
      var stat = cards[i];
      var card = document.createElement("div");
      card.className = "stat-card fade-in";
      card.style.animationDelay = (0.05 + i * 0.06) + "s";
      card.innerHTML =
        '<div class="stat-icon ' + stat.cls + '">' + stat.icon + '</div>' +
        '<div class="stat-value">' + stat.value + '</div>' +
        '<div class="stat-label">' + stat.label + '</div>';
      statsGrid.appendChild(card);
    }
  }

  function renderOverallProgress(stats) {
    overallProgress.innerHTML =
      '<span class="overall-progress-label">Загальний прогрес</span>' +
      '<div class="overall-progress-bar-wrap">' +
        '<div class="overall-progress-bar-bg">' +
          '<div class="overall-progress-bar-fill" id="overallFill"></div>' +
        '</div>' +
      '</div>' +
      '<span class="overall-progress-value">' + stats.episodesDone + ' / ' + stats.episodesTotal + ' еп. (' + stats.overallPercent + '%)</span>';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var fill = document.getElementById("overallFill");
        if (fill) fill.style.width = stats.overallPercent + "%";
      });
    });
  }

  // ===== Filters =====

  function renderFilters() {
    filterTabs.innerHTML = "";
    for (var i = 0; i < filters.length; i++) {
      (function (f) {
        var btn = document.createElement("button");
        btn.className = "filter-tab" + (f === activeFilter ? " active" : "");
        btn.textContent = f;
        btn.addEventListener("click", function () {
          activeFilter = f;
          var tabs = filterTabs.querySelectorAll(".filter-tab");
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove("active");
          btn.classList.add("active");
          renderProjects();
        });
        filterTabs.appendChild(btn);
      })(filters[i]);
    }
  }

  // ===== View Toggle =====

  function renderViewToggle() {
    viewToggle.innerHTML = "";
    var views = [
      { id: "list", icon: icons.list, title: "Список" },
      { id: "grid", icon: icons.grid, title: "Сітка" }
    ];

    for (var i = 0; i < views.length; i++) {
      (function (v) {
        var btn = document.createElement("button");
        btn.className = "view-btn" + (v.id === activeView ? " active" : "");
        btn.title = v.title;
        btn.innerHTML = v.icon;
        btn.addEventListener("click", function () {
          activeView = v.id;
          var btns = viewToggle.querySelectorAll(".view-btn");
          for (var j = 0; j < btns.length; j++) btns[j].classList.remove("active");
          btn.classList.add("active");
          renderProjects();
        });
        viewToggle.appendChild(btn);
      })(views[i]);
    }
  }

  // ===== Helpers =====

  function getStatusClass(status) {
    if (status === "Завершено") return "done";
    if (status === "В процесі") return "progress";
    return "planned";
  }

  function getPercentClass(statusCls) {
    if (statusCls === "done") return "done";
    if (statusCls === "progress") return "in-progress";
    return "planned";
  }

  function buildTagsHTML(work) {
    var html = "";
    for (var i = 0; i < work.length; i++) {
      html += '<span class="project-tag">' + work[i] + '</span>';
    }
    return html;
  }

  function buildPosterHTML(project, type) {
    const path = "https://raw.githubusercontent.com/DrBryanMan/CPRsubsList/refs/heads/main"
    if (project.poster) {
      const src = type === "list" ? project.poster : path + project.cover;
      return `<img src="${src}" alt="${project.title}">`;
    }

    return `
      <div class="poster-placeholder"
          style="background:linear-gradient(135deg, ${project.color}, ${project.color}88)">
        ${project.title.charAt(0)}
      </div>
    `;
  }


  // ===== Card Builders =====

  function buildListCard(project, percent, statusCls, index) {
    var card = document.createElement("div");
    card.className = "project-card fade-in";
    card.style.animationDelay = (index * 0.04) + "s";
    var percentCls = getPercentClass(statusCls);

    card.innerHTML =
      '<div class="project-poster">' + buildPosterHTML(project, "list") + '</div>' +
      '<div class="project-info">' +
        '<div class="project-title-row">' +
          '<span class="project-title">' + project.title + '</span>' +
          '<span class="status-badge status-' + statusCls + '">' +
            '<span class="status-dot"></span>' +
            project.status +
          '</span>' +
        '</div>' +
        '<div class="project-tags">' + buildTagsHTML(project.work) + '</div>' +
        '<div class="project-progress-row">' +
          '<div class="progress-bar-bg">' +
            '<div class="progress-bar-fill fill-' + statusCls + '" data-width="' + percent + '"></div>' +
          '</div>' +
          '<span class="progress-text">' + project.episodes + ' / ' + project.episodes_total + ' еп.</span>' +
        '</div>' +
      '</div>' +
      '<div class="project-percent ' + percentCls + '">' + percent + '%</div>';

    return card;
  }

  function buildGridCard(project, percent, statusCls, index) {
    var card = document.createElement("div");
    card.className = "project-card fade-in";
    card.style.animationDelay = (index * 0.04) + "s";
    var percentCls = getPercentClass(statusCls);

    card.innerHTML =
      '<div class="project-poster">' + buildPosterHTML(project, "grid") + '</div>' +
      '<div class="project-percent ' + percentCls + '">' + percent + '%</div>' +
      '<div class="project-info">' +
        '<div class="project-title-row">' +
          '<span class="project-title">' + project.title + '</span>' +
          '<span class="status-badge status-' + statusCls + '">' +
            '<span class="status-dot"></span>' +
            project.status +
          '</span>' +
        '</div>' +
        '<div class="project-tags">' + buildTagsHTML(project.work) + '</div>' +
        '<div class="project-progress-row">' +
          '<div class="progress-bar-bg">' +
            '<div class="progress-bar-fill fill-' + statusCls + '" data-width="' + percent + '"></div>' +
          '</div>' +
          '<span class="progress-text">' + project.episodes + ' / ' + project.episodes_total + ' еп.</span>' +
        '</div>' +
      '</div>';

    return card;
  }

  // ===== Render Projects =====

  function renderProjects() {
    var filtered = [];
    for (var i = 0; i < projects.length; i++) {
      if (activeFilter === "Всі" || projects[i].status === activeFilter) {
        filtered.push(projects[i]);
      }
    }

    projectList.innerHTML = "";
    projectList.className = "project-list" + (activeView === "grid" ? " view-grid" : "");

    if (filtered.length === 0) {
      projectList.innerHTML =
        '<div class="empty-state">' +
          icons.empty +
          '<p>Немає проєктів у цій категорії</p>' +
        '</div>';
      return;
    }

    for (var j = 0; j < filtered.length; j++) {
      var project = filtered[j];
      var percent = project.episodes_total > 0
        ? Math.round((project.episodes / project.episodes_total) * 100)
        : 0;
      var statusCls = getStatusClass(project.status);

      var card = activeView === "grid"
        ? buildGridCard(project, percent, statusCls, j)
        : buildListCard(project, percent, statusCls, j);

      projectList.appendChild(card);
    }

    // Animate progress bars
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var bars = projectList.querySelectorAll(".progress-bar-fill[data-width]");
        for (var k = 0; k < bars.length; k++) {
          bars[k].style.width = bars[k].getAttribute("data-width") + "%";
        }
      });
    });
  }

  // ===== Init =====

  function init() {
    var stats = computeStats();
    renderStats(stats);
    renderOverallProgress(stats);
    renderFilters();
    renderViewToggle();
    renderProjects();
  }

  // ===== Start =====

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProjects);
  } else {
    loadProjects();
  }
})();
