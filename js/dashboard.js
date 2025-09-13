document.addEventListener("DOMContentLoaded", () => {
  // Activity Chart (Bubble Style)
  new Chart(document.getElementById("activityChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Weekly Activities",
        data: [
          {x: 1, y: 20, r: 10},
          {x: 2, y: 30, r: 12},
          {x: 3, y: 25, r: 14},
          {x: 4, y: 60, r: 18},
          {x: 5, y: 45, r: 15},
          {x: 6, y: 40, r: 16}
        ],
        backgroundColor: "#8bcba7"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            callback: value => ["","Yoga","Journaling","Breathing","Music","Sound Therapy","Mood Tracking"][value]
          },
          grid: { drawOnChartArea: false }
        },
        y: {
          beginAtZero: true,
          max: 70,
          title: { display: true, text: "Minutes" }
        }
      },
      plugins: { legend: { display: false } }
    }
  });

  // Mood Tracker
  new Chart(document.getElementById("moodChart"), {
    type: "line",
    data: {
      labels: ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"],
      datasets: [{
        label: "Mood Level",
        data: [3,4,3,5,4,6,5,6,5,7,6,8],
        borderColor: "#8bcba7",
        backgroundColor: "rgba(139,203,167,0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "#8bcba7"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            callback: value => ["😡","😕","🙂","😀","😍"][value-1]
          }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
});
