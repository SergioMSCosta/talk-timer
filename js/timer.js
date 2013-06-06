function Timer(options) {
    this.ORTCAppKey = options.ORTCAppKey || '';
    this.ORTCAuthToken = options.ORTCAuthToken || '';
    this.ORTCUrl = options.ORTCUrl || '';
    this.ORTCChannel = options.ORTCChannel || '';
    this.debug = options.debug || false;
    this.showControls = options.showControls || false;
    this.controlsContainer = options.controlsContainer || 'controls';
    this.timerContainer = options.timerContainer || 'timer';
    this.timerFrom = options.timerFrom || 1;
    this.timerTo = options.timerTo || 60;
    this.timerInterval = options.timerInterval || 1;
    this.timerSetButtonText = options.timerSetButtonText || 'Set';
    this.timerGoButtonText = options.timerGoButtonText || 'Start';
    this.tmr;
    this.start;
    this.elapsed = 0;
    this.total = 0;

    var that = this;

    // Help function to pad numbers (0 -> 00, 3 -> 03, etc.)
    function pad(number, width, character) {
        character = character || '0';
        number = number + '';
        return number.length >= width ? number : new Array(width - number.length + 1).join(character) + number;
    }

    // Sets the timer
    function setTimer() {
        clearTimeout(that.tmr); // stops the countdown in case it's working
        that.elapsed = 0;
        that.total = parseInt(document.getElementById('timerMinutes')[document.getElementById('timerMinutes').selectedIndex].value) * 60;
        sendUpdate();
    }

    // Performs the countdown
    function timerCountdown(start)
    {
        if (that.seconds > 0) {

            var time = new Date().getTime() - that.start;
            that.elapsed = Math.floor(time / 100) / 10;

            if (start) {
                that.start = new Date().getTime();
                that.elapsed = 0;
                that.tmr = setInterval(function () { timerCountdown(); }, 1000);
            }

            sendUpdate();
        }
    }

    // Sends the update via Realtime.co
    function sendUpdate() {
        var minutes = Math.floor((that.total - that.elapsed) / 60);
        var seconds = parseInt((that.total - that.elapsed) - (minutes * 60));

        var msg = xRTML.MessageManager.create({
            action: '',
            data: {
                content: {
                    m: pad(minutes, 2),
                    s: pad(seconds, 2)
                }
            },
            trigger: 'update_timer'
        });

        xRTML.ConnectionManager.sendMessage({
            connections: ['myConn'],
            channel: that.ORTCChannel,
            content: msg
        });
    }

    // "Constructor" function
    function init() {
        // Add controls
        if (that.showControls) {
            var controlsContainer = document.getElementById(options.controlsContainer);
            var select = document.createElement('select');
            select.id = "timerMinutes";
            for (var i = that.timerFrom; i <= that.timerTo; i = i + that.timerInterval) {
                var option = document.createElement('option');
                option.value = pad(i, 2);
                option.innerHTML = option.value;
                select.appendChild(option);
            }
            controlsContainer.appendChild(select);

            that.seconds = parseInt(document.getElementById('timerMinutes').childNodes[0].value) * 60;

            // Adds the button that sets the timer
            var setTimerButton = document.createElement('button');
            setTimerButton.innerHTML = that.timerSetButtonText;
            setTimerButton.onclick = function () { setTimer(); };
            controlsContainer.appendChild(setTimerButton);

            // Adds the button that starts the countdown
            var goTimerButton = document.createElement('button');
            goTimerButton.innerHTML = that.timerGoButtonText;
            goTimerButton.onclick = function () { timerCountdown(true); };
            controlsContainer.appendChild(goTimerButton);
        }

        // Realtime stuff
        xRTML.load(function () {

            // Sets xRTML debug on or off
            xRTML.Config.debug = that.debug;

            // Creates the connection to the ORTC (Realtime) servers
            xRTML.ConnectionManager.create(
            {
                id: 'myConn',
                appkey: that.ORTCAppKey,
                authToken: that.ORTCAuthToken,
                url: that.ORTCUrl,
                channels: [
                    { name: that.ORTCChannel }
                ]
            });

            // Creates the controller that will set the timer
            xRTML.TagManager.create(
                {
                    id: "updatetimer",
                    name: "Execute",
                    triggers: ['update_timer'],
                    callback: function (data) {
                        document.getElementById(that.timerContainer).innerHTML = data.content.m + ':' + data.content.s;
                    }
                }
            );

        });
    }

    // Checks if we have the data we need and calls our "constructor" function if we have everything
    if (that.ORTCAppKey != '' &&
        that.ORTCAuthToken != '' &&
        that.ORTCUrl != '' &&
        that.ORTCChannel != '' &&
        (!that.showControls || (that.showControls && document.getElementById(that.timerContainer) != undefined)) &&
        document.getElementById(that.controlsContainer) != undefined) {

        init();
    }
}