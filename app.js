$(document).ready(function() {
    $(".form-group-time-quantum").hide();

    // Show hide RR time quantum
    $('#algorithmSelector').on('change', function() {
        if (this.value === 'optRR') {
            $(".form-group-time-quantum").show(1000);
        } else {
            $(".form-group-time-quantum").hide(1000);
        }
    });

    var processList = [];

    $('#btnAddProcess').on('click', function() {
        var processID = $('#processID');
        var arrivalTime = $('#arrivalTime');
        var burstTime = $('#burstTime');
        var priority = $('#priority'); // Add priority input

        if (processID.val() === '' || arrivalTime.val() === '' || burstTime.val() === '' || priority.val() === '') {
            processID.addClass('is-invalid');
            arrivalTime.addClass('is-invalid');
            burstTime.addClass('is-invalid');
            priority.addClass('is-invalid'); // Add priority validation
            return;
        }

        var process = {
            processID: parseInt(processID.val(), 10),
            arrivalTime: parseInt(arrivalTime.val(), 10),
            burstTime: parseInt(burstTime.val(), 10),
            priority: parseInt(priority.val(), 10) // Add priority value
        }

        processList.push(process);

        $('#tblProcessList > tbody:last-child').append(
            `<tr>
                <td id="tdProcessID">${processID.val()}</td>
                <td id="tdArrivalTime">${arrivalTime.val()}</td>
                <td id="tdBurstTime">${burstTime.val()}</td>
                <td id="tdPriority">${priority.val()}</td> <!-- Add priority column -->
            </tr>`
        );

        processID.val('');
        arrivalTime.val('');
        burstTime.val('');
        priority.val(''); // Clear priority input
    });

    $('#btnCalculate').on('click', function() {
        if (processList.length == 0) {
            alert('Please insert some processes');
            return;
        }

        var selectedAlgo = $('#algorithmSelector').children('option:selected').val();

        if (selectedAlgo === 'optFCFS') {
            firstComeFirstServed();
        }

        if (selectedAlgo === 'optSJF') {
            shortestJobFirst();
        }

        if (selectedAlgo === 'optSRTF') {
            shortestRemainingTimeFirst();
        }

        if (selectedAlgo === 'optRR') {
            roundRobin();
        }

        if (selectedAlgo === 'optP') {
            priorityScheduling(); // Add priority scheduling option
        }
    });

    function firstComeFirstServed() {
        var time = 0;
        var queue = [];
        var completedList = [];
        var ganttData = [];
    
        while (processList.length > 0 || queue.length > 0) {
            while (queue.length == 0 && processList.length > 0) {
                addToQueue();
                if (queue.length == 0) {
                    time++;
                }
            }
    
            // Dequeue from queue and run the process.
            if (queue.length > 0) {
                var process = queue.shift();
                var startTime = time;
                for (var i = 0; i < process.burstTime; i++) {
                    time++;
                    addToQueue();
                }
                process.completedTime = time;
                process.turnAroundTime = process.completedTime - process.arrivalTime;
                process.waitingTime = process.turnAroundTime - process.burstTime;
                completedList.push(process);
    
                // Add to Gantt chart data
                ganttData.push({
                    processID: process.processID,
                    startTime: startTime,
                    endTime: time
                });
            }
        }
    
        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (time >= processList[i].arrivalTime) {
                    var process = {
                        processID: processList[i].processID,
                        arrivalTime: processList[i].arrivalTime,
                        burstTime: processList[i].burstTime
                    }
                    processList.splice(i, 1);
                    queue.push(process);
                }
            }
        }
    
        // Bind table data
        $.each(completedList, function(key, process) {
            $('#tblResults > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${process.processID}</td>
                    <td id="tdArrivalTime">${process.arrivalTime}</td>
                    <td id="tdBurstTime">${process.burstTime}</td>
                    <td id="tdCompletedTime">${process.completedTime}</td>
                    <td id="tdWaitingTime">${process.waitingTime}</td>
                    <td id="tdTurnAroundTime">${process.turnAroundTime}</td>
                </tr>`
            );
        });
    
        // Get average
        var avgTurnaroundTime = 0;
        var avgWaitingTime = 0;
        var maxCompletedTime = 0;
    
        $.each(completedList, function(key, process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
            avgWaitingTime = avgWaitingTime + process.waitingTime;
        });
    
        $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
        $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
        $('#throughput').val(completedList.length / maxCompletedTime);
    
        // Create Gantt chart
        createGanttChart(ganttData);
    }

    function shortestJobFirst() {
        var completedList = [];
        var time = 0;
        var queue = [];
        var ganttData = [];

        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0) {
                time++;
                addToQueue();
            }
            processToRun = selectProcess();
            var startTime = time;
            for (var i = 0; i < processToRun.burstTime; i++) {
                time++;
                addToQueue();
            }
            processToRun.completedTime = time;
            processToRun.turnAroundTime = processToRun.completedTime - processToRun.arrivalTime;
            processToRun.waitingTime = processToRun.turnAroundTime - processToRun.burstTime;
            completedList.push(processToRun);

            // Add to Gantt chart data
            ganttData.push({
                processID: processToRun.processID,
                startTime: startTime,
                endTime: time
            });
        }

        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime === time) {
                    var process = {
                        processID: processList[i].processID,
                        arrivalTime: processList[i].arrivalTime,
                        burstTime: processList[i].burstTime
                    }
                    processList.splice(i, 1);
                    queue.push(process);
                }
            }
        }

        function selectProcess() {
            if (queue.length != 0) {
                queue.sort(function(a, b) {
                    return a.burstTime - b.burstTime;
                });
            }
            return queue.shift();
        }

        // Bind table data
        $.each(completedList, function(key, process) {
            $('#tblResults > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${process.processID}</td>
                    <td id="tdArrivalTime">${process.arrivalTime}</td>
                    <td id="tdBurstTime">${process.burstTime}</td>
                    <td id="tdBurstTime">${process.completedTime}</td>
                    <td id="tdBurstTime">${process.waitingTime}</td>
                    <td id="tdBurstTime">${process.turnAroundTime}</td>
                </tr>`
            );
        });

        // Get average
        var avgTurnaroundTime = 0;
        var avgWaitingTime = 0;
        var maxCompletedTime = 0;

        $.each(completedList, function(key, process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
            avgWaitingTime = avgWaitingTime + process.waitingTime;
        });

        $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
        $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
        $('#throughput').val(completedList.length / maxCompletedTime);

        // Create Gantt chart
        createGanttChart(ganttData);
    }

    function shortestRemainingTimeFirst() {
        var completedList = [];
        var time = 0;
        var queue = [];
        var ganttData = [];
    
        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0 && processList.length > 0) {
                time++;
                addToQueue();
            }
            if (queue.length > 0) {
                selectProcessForSRTF();
                runSRTF();
            }
        }
    
        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime <= time) {
                    var process = {
                        processID: processList[i].processID,
                        arrivalTime: processList[i].arrivalTime,
                        burstTime: processList[i].burstTime
                    }
                    processList.splice(i, 1);
                    queue.push(process);
                }
            }
        }
    
        function selectProcessForSRTF() {
            if (queue.length != 0) {
                queue.sort(function(a, b) {
                    return a.burstTime - b.burstTime;
                });
                var process = queue[0];
                ganttData.push({
                    processID: process.processID,
                    startTime: time,
                    endTime: time + 1
                });
                queue[0].burstTime -= 1;
                if (queue[0].burstTime == 0) {
                    process.completedTime = time + 1;
                    completedList.push(queue.shift());
                }
            }
        }
    
        function runSRTF() {
            time++;
            addToQueue();
        }
    
        // Fetch initial table data
        var TableData = [];
        $('#tblProcessList tr').each(function(row, tr) {
            TableData[row] = {
                "processID": parseInt($(tr).find('td:eq(0)').text()),
                "arrivalTime": parseInt($(tr).find('td:eq(1)').text()),
                "burstTime": parseInt($(tr).find('td:eq(2)').text())
            }
        });
    
        // Remove table header row
        TableData.splice(0, 1);
    
        // Reset burst time from original input table.
        TableData.forEach(pInTable => {
            completedList.forEach(pInCompleted => {
                if (pInTable.processID == pInCompleted.processID) {
                    pInCompleted.burstTime = pInTable.burstTime;
                    pInCompleted.turnAroundTime = pInCompleted.completedTime - pInCompleted.arrivalTime;
                    pInCompleted.waitingTime = pInCompleted.turnAroundTime - pInCompleted.burstTime;
                }
            });
        });
    
        // Bind table data
        $.each(completedList, function(key, process) {
            $('#tblResults > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${process.processID}</td>
                    <td id="tdArrivalTime">${process.arrivalTime}</td>
                    <td id="tdBurstTime">${process.burstTime}</td>
                    <td id="tdCompletedTime">${process.completedTime}</td>
                    <td id="tdWaitingTime">${process.waitingTime}</td>
                    <td id="tdTurnAroundTime">${process.turnAroundTime}</td>
                </tr>`
            );
        });
    
        // Get average
        var avgTurnaroundTime = 0;
        var avgWaitingTime = 0;
        var maxCompletedTime = 0;
    
        $.each(completedList, function(key, process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
            avgWaitingTime = avgWaitingTime + process.waitingTime;
        });
    
        $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
        $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
        $('#throughput').val(completedList.length / maxCompletedTime);
    
        // Create Gantt chart
        createGanttChart(ganttData);
    }

    function roundRobin() {
        var timeQuantum = $('#timeQuantum');
        var timeQuantumVal = parseInt(timeQuantum.val(), 10);
        if (timeQuantum.val() == '') {
            alert('Please enter time quantum');
            timeQuantum.addClass('is-invalid');
            return;
        }
        var completedList = [];
        var time = 0;
        var queue = [];
        var ganttData = [];
    
        // Add initial processes to the queue
        addToQueue();
    
        while (processList.length > 0 || queue.length > 0) {
            while (queue.length == 0 && processList.length > 0) {
                time++;
                addToQueue();
            }
            if (queue.length > 0) {
                selectProcessForRR();
            }
        }
    
        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime <= time) {
                    var process = {
                        processID: processList[i].processID,
                        arrivalTime: processList[i].arrivalTime,
                        burstTime: processList[i].burstTime
                    }
                    processList.splice(i, 1);
                    queue.push(process);
                    i--; // Adjust index after splice
                }
            }
        }
    
        function selectProcessForRR() {
            var process = queue.shift();
            var startTime = time;
            var executionTime = Math.min(process.burstTime, timeQuantumVal);
    
            for (var i = 0; i < executionTime; i++) {
                time++;
                addToQueue();
            }
    
            process.burstTime -= executionTime;
    
            ganttData.push({
                processID: process.processID,
                startTime: startTime,
                endTime: time
            });
    
            if (process.burstTime > 0) {
                queue.push(process);
            } else {
                process.completedTime = time;
                process.turnAroundTime = process.completedTime - process.arrivalTime;
                process.waitingTime = process.turnAroundTime - process.burstTime;
                completedList.push(process);
            }
        }
    
        // Fetch initial table data
        var TableData = [];
        $('#tblProcessList tr').each(function(row, tr) {
            TableData[row] = {
                "processID": parseInt($(tr).find('td:eq(0)').text()),
                "arrivalTime": parseInt($(tr).find('td:eq(1)').text()),
                "burstTime": parseInt($(tr).find('td:eq(2)').text())
            }
        });
    
        // Remove table header row
        TableData.splice(0, 1);
    
        // Reset burst time from original input table.
        TableData.forEach(pInTable => {
            completedList.forEach(pInCompleted => {
                if (pInTable.processID == pInCompleted.processID) {
                    pInCompleted.burstTime = pInTable.burstTime;
                    pInCompleted.turnAroundTime = pInCompleted.completedTime - pInCompleted.arrivalTime;
                    pInCompleted.waitingTime = pInCompleted.turnAroundTime - pInCompleted.burstTime;
                }
            });
        });
    
        // Bind table data
        $.each(completedList, function(key, process) {
            $('#tblResults > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${process.processID}</td>
                    <td id="tdArrivalTime">${process.arrivalTime}</td>
                    <td id="tdBurstTime">${process.burstTime}</td>
                    <td id="tdCompletedTime">${process.completedTime}</td>
                    <td id="tdWaitingTime">${process.waitingTime}</td>
                    <td id="tdTurnAroundTime">${process.turnAroundTime}</td>
                </tr>`
            );
        });
    
        // Get average
        var totalTurnaroundTime = 0;
        var totalWaitingTime = 0;
        var maxCompletedTime = 0;
    
        $.each(completedList, function(key, process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            totalTurnaroundTime = totalTurnaroundTime + process.turnAroundTime;
            totalWaitingTime = totalWaitingTime + process.waitingTime;
        });
    
        $('#avgTurnaroundTime').val(totalTurnaroundTime / completedList.length);
        $('#avgWaitingTime').val(totalWaitingTime / completedList.length);
        $('#throughput').val(completedList.length / maxCompletedTime);
    
        // Create Gantt chart
        createGanttChart(ganttData);
    }

    function priorityScheduling() {
        var completedList = [];
        var time = 0;
        var queue = [];
        var ganttData = [];
    
        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0 && processList.length > 0) {
                time++;
                addToQueue();
            }
            if (queue.length > 0) {
                queue.sort(function(a, b) {
                    return a.priority - b.priority; // Sort by priority (lower number means higher priority)
                });
                var process = queue.shift();
                var startTime = time;
                for (var i = 0; i < process.burstTime; i++) {
                    time++;
                    addToQueue();
                }
                process.completedTime = time;
                process.turnAroundTime = process.completedTime - process.arrivalTime;
                process.waitingTime = process.turnAroundTime - process.burstTime;
                completedList.push(process);
    
                // Add to Gantt chart data
                ganttData.push({
                    processID: process.processID,
                    startTime: startTime,
                    endTime: time
                });
            }
        }
    
        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime <= time) {
                    var process = {
                        processID: processList[i].processID,
                        arrivalTime: processList[i].arrivalTime,
                        burstTime: processList[i].burstTime,
                        priority: processList[i].priority
                    }
                    processList.splice(i, 1);
                    queue.push(process);
                    i--; // Adjust index after splice
                }
            }
        }
    
        // Bind table data
        $.each(completedList, function(key, process) {
            $('#tblResults > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${process.processID}</td>
                    <td id="tdArrivalTime">${process.arrivalTime}</td>
                    <td id="tdBurstTime">${process.burstTime}</td>
                    <td id="tdPriority">${process.priority}</td>
                    <td id="tdCompletedTime">${process.completedTime}</td>
                    <td id="tdWaitingTime">${process.waitingTime}</td>
                    <td id="tdTurnAroundTime">${process.turnAroundTime}</td>
                </tr>`
            );
        });
    
        // Get average
        var avgTurnaroundTime = 0;
        var avgWaitingTime = 0;
        var maxCompletedTime = 0;
    
        $.each(completedList, function(key, process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
            avgWaitingTime = avgWaitingTime + process.waitingTime;
        });
    
        $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
        $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
        $('#throughput').val(completedList.length / maxCompletedTime);
    
        // Create Gantt chart
        createGanttChart(ganttData);
    }
    
    

    function createGanttChart(ganttData) {
        const table = $('<table class="table table-bordered"></table>');
        const headerRow = $('<tr></tr>');
        for (let i = 0; i <= Math.max(...ganttData.map(d => d.endTime)); i++) {
            headerRow.append(`<th>${i}</th>`);
        }
        table.append(headerRow);
    
        const dataRow = $('<tr></tr>');
        for (let i = 0; i <= Math.max(...ganttData.map(d => d.endTime)); i++) {
            const cell = $('<td></td>');
            const process = ganttData.find(d => d.startTime <= i && d.endTime > i);
            if (process) {
                cell.text(`P${process.processID}`);
                cell.css('background-color', getRandomColor());
            }
            dataRow.append(cell);
        }
        table.append(dataRow);
    
        $('#gantt-chart').html(table);
    }
    
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});
