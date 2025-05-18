const apiURL = "https://gist.githubusercontent.com/ai-cristea/95bf91857a4cbe138595ea6876c441f2/raw/date-jira.json";

async function fetchData() {
  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error loading data:", err);
    return null;
  }
}

function normalizeStatuses(data) {
  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "To Do" && task.actual_hours > 0) {
        task.status = "In Progress";
      }
    });
  });
}

function renderPieChartsByStatus(data) {
  const container = document.getElementById("charts-pie");
  container.innerHTML = "";

  const rowDiv = document.createElement("div");
  rowDiv.className = "pie-row";
  container.appendChild(rowDiv);

  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      const dev = task.assigned_to;
      const status = task.status;

      if (!devStats[dev]) {
        devStats[dev] = { todo: 0, inprogress: 0, done: 0 };
      }

      if (status === "To Do") devStats[dev].todo += 1;
      else if (status === "In Progress") devStats[dev].inprogress += 1;
      else if (status === "Done") devStats[dev].done += 1;
    });
  });

  Object.entries(devStats).forEach(([developer, counts], index) => {
    const chartContainer = document.createElement("div");
    chartContainer.style.display = "flex";
    chartContainer.style.flexDirection = "column";
    chartContainer.style.alignItems = "center";

    const title = document.createElement("div");
    title.className = "chart-title";
    title.innerText = `${developer}`;

    const chartDiv = document.createElement("div");
    chartDiv.id = `pie-chart-${index}`;
    chartDiv.className = "pie-chart";

    chartContainer.appendChild(title);
    chartContainer.appendChild(chartDiv);
    rowDiv.appendChild(chartContainer);

    Highcharts.chart(chartDiv.id, {
      chart: { type: 'pie' },
      title: { text: null },
      tooltip: {
        pointFormat: '<b>{point.y} tasks</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          }
        }
      },
      series: [{
        name: 'Task Status',
        colorByPoint: true,
        data: [
          { name: 'To Do', y: counts.todo, color: '#dc3545' },
          { name: 'In Progress', y: counts.inprogress, color: '#ffc107' },
          { name: 'Done', y: counts.done, color: '#28a745' }
        ]
      }]
    });
  });
}

function renderTaskTypeDistribution(data) {
  const container = document.getElementById("charts-types");
  container.innerHTML = "";

  const rowDiv = document.createElement("div");
  rowDiv.className = "pie-row";
  container.appendChild(rowDiv);

  const devTypes = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      const dev = task.assigned_to;
      if (!devTypes[dev]) devTypes[dev] = { Bug: 0, Story: 0, Task: 0 };
      devTypes[dev][task.type] += 1;
    });
  });

  Object.entries(devTypes).forEach(([developer, counts], index) => {
    const chartContainer = document.createElement("div");
    chartContainer.style.display = "flex";
    chartContainer.style.flexDirection = "column";
    chartContainer.style.alignItems = "center";

    const title = document.createElement("div");
    title.className = "chart-title";
    title.innerText = `${developer}`;

    const chartDiv = document.createElement("div");
    chartDiv.id = `pie-type-${index}`;
    chartDiv.className = "pie-chart";

    chartContainer.appendChild(title);
    chartContainer.appendChild(chartDiv);
    rowDiv.appendChild(chartContainer);

    Highcharts.chart(chartDiv.id, {
      chart: { type: 'pie' },
      title: { text: null },
      tooltip: {
        pointFormat: '<b>{point.y} tasks</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          }
        }
      },
      series: [{
        name: 'Task Type',
        colorByPoint: true,
        data: [
          { name: 'Bug', y: counts.Bug },
          { name: 'Story', y: counts.Story },
          { name: 'Task', y: counts.Task }
        ]
      }]
    });
  });
}

function renderEstimationAccuracyPerDeveloper(data) {
  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "Done") {
        const dev = task.assigned_to;
        if (!devStats[dev]) {
          devStats[dev] = { done: 0, accurate: 0 };
        }

        devStats[dev].done += 1;

        if (task.actual_hours <= task.estimated_hours) {
          devStats[dev].accurate += 1;
        }
      }
    });
  });

  const developers = Object.keys(devStats);
  const accuracyPercentages = developers.map(dev => {
    const stats = devStats[dev];
    return stats.done > 0
      ? Number(((stats.accurate / stats.done) * 100).toFixed(2))
      : 0;
  });

  Highcharts.chart('chart-estimation-accuracy', {
    chart: { type: 'column' },
    title: { text: 'Estimation Accuracy (Actual ≤ Estimated)' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Accuracy (%)' }
    },
    tooltip: {
      pointFormat: '<b>{point.y}%</b> of Done tasks were estimated correctly'
    },
    series: [{
      name: 'Accurate Estimates',
      data: accuracyPercentages,
      color: '#28a745'
    }]
  });
}

function renderUnderestimatedTasksChart(data) {
  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "Done") {
        const dev = task.assigned_to;
        if (!devStats[dev]) {
          devStats[dev] = { totalDone: 0, underestimated: 0 };
        }
        devStats[dev].totalDone += 1;
        if (task.actual_hours > task.estimated_hours) {
          devStats[dev].underestimated += 1;
        }
      }
    });
  });

  const developers = Object.keys(devStats);
  const underestimatedPercents = developers.map(dev => {
    const stats = devStats[dev];
    return stats.totalDone > 0
      ? Number(((stats.underestimated / stats.totalDone) * 100).toFixed(2))
      : 0;
  });

  Highcharts.chart('chart-underestimation', {
    chart: { type: 'column' },
    title: { text: 'Underestimated Tasks (Actual > Estimated)' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Underestimation (%)' }
    },
    tooltip: {
      pointFormat: '<b>{point.y}%</b> of completed tasks were underestimated'
    },
    series: [{
      name: 'Underestimated (%)',
      data: underestimatedPercents,
      color: '#ff5733'
    }]
  });
}

function renderMeanEstimationError(data) {
  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "Done" && task.estimated_hours > 0) {
        const dev = task.assigned_to;
        if (!devStats[dev]) {
          devStats[dev] = { totalError: 0, count: 0 };
        }
        const error = ((task.actual_hours - task.estimated_hours) / task.estimated_hours) * 100;
        devStats[dev].totalError += error;
        devStats[dev].count += 1;
      }
    });
  });

  const developers = Object.keys(devStats);
  const meanErrors = developers.map(dev => {
    const stats = devStats[dev];
    return stats.count > 0 ? Number((stats.totalError / stats.count).toFixed(2)) : 0;
  });

  Highcharts.chart('chart-mean-estimation-error', {
    chart: { type: 'column' },
    title: { text: 'Mean Estimation Error per Developer (%)' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      title: { text: 'Estimation Error (%)' },
      plotLines: [{
        color: '#000',
        width: 1,
        value: 0,
        zIndex: 5
      }]
    },
    tooltip: {
      pointFormat: 'Average error: <b>{point.y}%</b>'
    },
    series: [{
      name: 'Mean Estimation Error',
      data: meanErrors,
      color: '#8884d8'
    }]
  });
}

function renderEstimationErrorByType(data) {
  const devErrors = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status !== "Done") return;

      const dev = task.assigned_to;
      const type = task.type;
      const error = ((task.actual_hours - task.estimated_hours) / task.estimated_hours) * 100;

      if (!devErrors[dev]) devErrors[dev] = {};
      if (!devErrors[dev][type]) devErrors[dev][type] = [];

      devErrors[dev][type].push(error);
    });
  });

  const developers = Object.keys(devErrors);
  const taskTypes = ['Bug', 'Story', 'Task'];

  const series = taskTypes.map(type => ({
    name: type,
    data: developers.map(dev => {
      const values = devErrors[dev][type] || [];
      if (values.length === 0) return 0;
      return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    })
  }));

  Highcharts.chart('bar-error-task-type', {
    chart: { type: 'column' },
    title: { text: 'Mean Estimation Error by Task Type (Done tasks only)' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      min: null,
      title: { text: 'Estimation Error (%)' }
    },
    tooltip: {
      pointFormat: '<b>{point.y}%</b> average error on {series.name} tasks'
    },
    series: series
  });
}

function renderInProgressTaskRisk(data) {
  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status !== "In Progress") return;

      const dev = task.assigned_to;
      if (!devStats[dev]) {
        devStats[dev] = { onTime: 0, exceeded: 0 };
      }

      if (task.actual_hours <= task.estimated_hours) {
        devStats[dev].onTime += 1;
      } else {
        devStats[dev].exceeded += 1;
      }
    });
  });

  const developers = Object.keys(devStats);

  const onTimePercents = developers.map(dev => {
    const stats = devStats[dev];
    const total = stats.onTime + stats.exceeded;
    return total > 0 ? Number(((stats.onTime / total) * 100).toFixed(2)) : 0;
  });

  const exceededPercents = developers.map(dev => {
    const stats = devStats[dev];
    const total = stats.onTime + stats.exceeded;
    return total > 0 ? Number(((stats.exceeded / total) * 100).toFixed(2)) : 0;
  });

  Highcharts.chart('chart-inprogress-risk', {
    chart: { type: 'column' },
    title: { text: 'Estimation Accuracy for In Progress Tasks' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Percentage of Tasks (%)' }
    },
    tooltip: {
      shared: true,
      formatter: function () {
        return `<b>${this.x}</b><br/>` +
          this.points.map(p => `${p.series.name}: <b>${p.y}%</b>`).join('<br/>');
      }
    },
    plotOptions: {
      column: {
        grouping: true,
        shadow: false
      }
    },
    series: [
      {
        name: 'On Time',
        data: onTimePercents,
        color: '#28a745'
      },
      {
        name: 'Exceeded Estimate',
        data: exceededPercents,
        color: '#dc3545'
      }
    ]
  });
}

function renderAvgCloseTime(data) {
  const devStats = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "Done" && task.closed_at) {
        const dev = task.assigned_to;
        const created = new Date(task.created_at);
        const closed = new Date(task.closed_at);
        const daysToClose = (closed - created) / (1000 * 60 * 60 * 24); // difference in days

        if (!devStats[dev]) devStats[dev] = [];
        devStats[dev].push(daysToClose);
      }
    });
  });

  const developers = Object.keys(devStats);
  const avgCloseTimes = developers.map(dev => {
    const total = devStats[dev].reduce((sum, val) => sum + val, 0);
    return Number((total / devStats[dev].length).toFixed(2));
  });

  Highcharts.chart('chart-close-time', {
    chart: { type: 'column' },
    title: { text: 'Average Closure Time (Done Tasks)' },
    xAxis: {
      categories: developers,
      title: { text: 'Developer' }
    },
    yAxis: {
      title: { text: 'Average Days to Close' }
    },
    tooltip: {
      pointFormat: 'Average time: <b>{point.y} days</b>'
    },
    series: [{
      name: 'Average Days',
      data: avgCloseTimes,
      color: '#17a2b8'
    }]
  });
}

function renderTaskHoursDone(data) {
  const container = document.getElementById("charts-error");
  container.innerHTML = "";

  const devTasks = {};

  data.sprints.forEach(sprint => {
    sprint.tasks
      .filter(task => task.status === "Done")
      .forEach(task => {
        const dev = task.assigned_to;
        if (!devTasks[dev]) devTasks[dev] = [];
        devTasks[dev].push(task);
      });
  });

  Object.entries(devTasks).forEach(([developer, tasks], index) => {
    const taskLabels = tasks.map(task => task.id);
    const estimated = tasks.map(task => task.estimated_hours);
    const actual = tasks.map(task => task.actual_hours);

    const chartId = `chart-done-${index}`;
    const chartDiv = document.createElement("div");
    chartDiv.id = chartId;
    chartDiv.style.height = "400px";
    chartDiv.style.marginBottom = "40px";
    container.appendChild(chartDiv);

    Highcharts.chart(chartId, {
      chart: { type: 'column' },
      title: { text: `Estimated vs Actual Hours (Done Tasks) - ${developer}` },
      xAxis: {
        categories: taskLabels,
        title: { text: 'Task ID' },
        labels: { rotation: -45 }
      },
      yAxis: {
        min: 0,
        title: { text: 'Hours' }
      },
      tooltip: {
        shared: true,
        pointFormat:
          '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}h</b><br/>'
      },
      plotOptions: {
        column: { grouping: true, shadow: false }
      },
      series: [
        { name: 'Estimated Hours', data: estimated, color: '#007bff' },
        { name: 'Actual Hours', data: actual, color: '#28a745' }
      ]
    });
  });
}

function renderTaskHoursInProgress(data) {
  const container = document.getElementById("charts-inprogress");
  container.innerHTML = "";

  const devTasks = {};

  data.sprints.forEach(sprint => {
    sprint.tasks
      .filter(task => task.status === "In Progress")
      .forEach(task => {
        const dev = task.assigned_to;
        if (!devTasks[dev]) devTasks[dev] = [];
        devTasks[dev].push(task);
      });
  });

  Object.entries(devTasks).forEach(([developer, tasks], index) => {
    const taskLabels = tasks.map(task => task.id);
    const estimated = tasks.map(task => task.estimated_hours);
    const actual = tasks.map(task => task.actual_hours);

    const chartId = `chart-inprogress-${index}`;
    const chartDiv = document.createElement("div");
    chartDiv.id = chartId;
    chartDiv.style.height = "400px";
    chartDiv.style.marginBottom = "40px";
    container.appendChild(chartDiv);

    Highcharts.chart(chartId, {
      chart: { type: 'column' },
      title: { text: `Estimated vs Logged Hours (In Progress Tasks) - ${developer}` },
      xAxis: {
        categories: taskLabels,
        title: { text: 'Task ID' },
        labels: { rotation: -45 }
      },
      yAxis: {
        min: 0,
        title: { text: 'Hours' }
      },
      tooltip: {
        shared: true,
        pointFormat:
          '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}h</b><br/>'
      },
      plotOptions: {
        column: { grouping: true, shadow: false }
      },
      series: [
        { name: 'Estimated Hours', data: estimated, color: '#ffc107' },
        { name: 'Logged Hours', data: actual, color: '#17a2b8' }
      ]
    });
  });
}

function renderSprintMemberPie(data) {
  const container = document.getElementById("sprint-pie-row");
  container.innerHTML = "";

  data.sprints.forEach((sprint, index) => {
    const counts = {};
    sprint.tasks.forEach(task => {
      const dev = task.assigned_to;
      if (!counts[dev]) counts[dev] = 0;
      counts[dev]++;
    });

    const total = sprint.tasks.length;
    const pieData = Object.entries(counts).map(([dev, count]) => ({
      name: dev,
      y: Number(((count / total) * 100).toFixed(2))
    }));

    const chartId = `sprint-members-${index}`;
    const chartDiv = document.createElement("div");
    chartDiv.className = "pie-chart";
    chartDiv.id = chartId;
    container.appendChild(chartDiv);

    Highcharts.chart(chartId, {
      chart: { type: 'pie' },
      title: { text: `Member Contribution - ${sprint.name}` },
      tooltip: {
        pointFormat: '<b>{point.y}%</b> of tasks'
      },
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%'
          }
        }
      },
      series: [{
        name: 'Contribution',
        colorByPoint: true,
        data: pieData
      }]
    });
  });
}

function renderSprintWorkloadShare(data) {
  const container = document.getElementById("chart-sprint-workload");
  container.innerHTML = "";

  const categories = []; 
  const devSet = new Set(); 
  const devSprintHours = {};

  data.sprints.forEach((sprint, sprintIndex) => {
    const sprintName = sprint.name;
    categories.push(sprintName);

    const sprintTotalHours = sprint.tasks.reduce((sum, t) => sum + t.actual_hours, 0);
    const hoursPerDev = {};

    sprint.tasks.forEach(task => {
      const dev = task.assigned_to;
      devSet.add(dev);
      if (!hoursPerDev[dev]) hoursPerDev[dev] = 0;
      hoursPerDev[dev] += task.actual_hours;
    });

    devSet.forEach(dev => {
      if (!devSprintHours[dev]) devSprintHours[dev] = [];
      const share = sprintTotalHours > 0 ? (hoursPerDev[dev] || 0) / sprintTotalHours * 100 : 0;
      devSprintHours[dev].push(Number(share.toFixed(2)));
    });
  });

  const series = Array.from(devSet).map(dev => ({
    name: dev,
    data: devSprintHours[dev]
  }));

  Highcharts.chart("chart-sprint-workload", {
    chart: { type: 'column' },
    title: { text: 'Developer Workload Share per Sprint' },
    xAxis: { categories, title: { text: 'Sprints' } },
    yAxis: {
      max: 100,
      title: { text: 'Workload Share (%)' },
      stackLabels: { enabled: true }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y:.2f}%</b><br/>',
      shared: true
    },
    plotOptions: {
      column: {
        stacking: 'percent'
      }
    },
    series
  });
}  

function renderSprintErrorBar(data) {
  const categories = [];
  const values = [];

  data.sprints.forEach(sprint => {
    let total = 0, count = 0;

    sprint.tasks.forEach(task => {
      if (task.status === "Done" && task.estimated_hours > 0) {
        const error = ((task.actual_hours - task.estimated_hours) / task.estimated_hours) * 100;
        total += error;
        count++;
      }
    });

    categories.push(sprint.name);
    values.push(count > 0 ? Number((total / count).toFixed(2)) : 0);
  });

  Highcharts.chart("sprint-error-bar", {
    chart: { type: 'column' },
    title: { text: 'Average Estimation Error per Sprint' },
    xAxis: { categories },
    yAxis: {
      title: { text: 'Error (%)' },
      min: null  
    },
    series: [{
      name: 'Average Error (%)',
      data: values,
      color: '#8884d8'
    }]
  });
}


function renderSprintUnfinishedBar(data) {
  const categories = [];
  const values = [];

  data.sprints.forEach(sprint => {
    const total = sprint.tasks.length;
    const unfinished = sprint.tasks.filter(t => t.status !== "Done").length;
    const rate = total > 0 ? Number((unfinished / total * 100).toFixed(1)) : 0;
    categories.push(sprint.name);
    values.push(rate);
  });

  Highcharts.chart("sprint-unfinished-bar", {
    chart: { type: 'column' },
    title: { text: 'Unfinished Tasks per Sprint' },
    xAxis: { categories },
    yAxis: {  title: { text: 'Percentage (%)' }, min: null },
    series: [{
      name: 'Unfinished (%)',
      data: values,
      color: '#ffc107'
    }]
  });
}

function renderSprintCompletionBar(data) {
  const categories = [];
  const values = [];

  data.sprints.forEach(sprint => {
    const total = sprint.tasks.length;
    const done = sprint.tasks.filter(t => t.status === "Done").length;
    const rate = total > 0 ? Number((done / total * 100).toFixed(1)) : 0;
    categories.push(sprint.name);
    values.push(rate);
  });

  Highcharts.chart("sprint-completion-bar", {
    chart: { type: 'column' },
    title: { text: 'Completion Rate per Sprint' },
    xAxis: { categories },
    yAxis: { max: 100, title: { text: 'Percentage (%)' } },
    series: [{
      name: 'Completed (%)',
      data: values,
      color: '#28a745'
    }]
  });
}

function renderSprintLateBar(data) {
  const categories = [];
  const values = [];

  data.sprints.forEach(sprint => {
    const sprintEnd = new Date(sprint.end_date);
    let totalDone = 0, late = 0;

    sprint.tasks.forEach(task => {
      if (task.status === "Done") {
        totalDone++;
        if (task.closed_at && new Date(task.closed_at) > sprintEnd) {
          late++;
        }
      }
    });

    const rate = totalDone > 0 ? Number((late / totalDone * 100).toFixed(1)) : 0;
    categories.push(sprint.name);
    values.push(rate);
  });

  Highcharts.chart("sprint-late-bar", {
    chart: { type: 'column' },
    title: { text: 'Tasks Closed After Deadline per Sprint' },
    xAxis: { categories },
    yAxis: { max: 100, title: { text: 'Percentage (%)' } },
    series: [{
      name: 'Closed Late (%)',
      data: values,
      color: '#dc3545'
    }]
  });
}

function renderTaskThroughputOverTime(data) {
  const weeklyCounts = {};

  data.sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      if (task.status === "Done" && task.closed_at) {
        const closedDate = new Date(task.closed_at);
        const year = closedDate.getFullYear();
        const week = getISOWeek(closedDate);
        const label = `${year}-W${week}`;

        if (!weeklyCounts[label]) weeklyCounts[label] = 0;
        weeklyCounts[label]++;
      }
    });
  });

  const sortedWeeks = Object.keys(weeklyCounts).sort();
  const taskCounts = sortedWeeks.map(week => weeklyCounts[week]);

  Highcharts.chart("chart-throughput", {
    chart: { type: "column" },
    title: { text: "Task Throughput Over Time" },
    xAxis: {
      categories: sortedWeeks,
      title: { text: "Week" },
      labels: { rotation: -45 }
    },
    yAxis: {
      min: 0,
      title: { text: "Tasks Completed" }
    },
    tooltip: {
      pointFormat: "<b>{point.y}</b> tasks completed"
    },
    series: [{
      name: "Tasks",
      data: taskCounts,
      color: "#007bff"
    }]
  });
}

function getISOWeek(date) {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
  const yearStart = new Date(temp.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

fetchData().then(data => {
  if (!data) return;

  normalizeStatuses(data);
  renderPieChartsByStatus(data);
  renderTaskTypeDistribution(data);
  renderEstimationAccuracyPerDeveloper(data);
  renderUnderestimatedTasksChart(data); 
  renderMeanEstimationError(data);
  renderEstimationErrorByType(data);
  renderInProgressTaskRisk(data);
  renderAvgCloseTime(data);
  renderTaskHoursDone(data);
  renderTaskHoursInProgress(data);  
  renderSprintMemberPie(data);
  renderSprintWorkloadShare(data);
  renderSprintErrorBar(data);
  renderSprintUnfinishedBar(data);
  renderSprintCompletionBar(data);
  renderSprintLateBar(data);
  renderTaskThroughputOverTime(data);
});
