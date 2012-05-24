/*global define*/
define([
        './JulianDate',
        './ClockStep',
        './ClockRange',
        './TimeStandard'
    ], function(
        JulianDate,
        ClockStep,
        ClockRange,
        TimeStandard) {
    "use strict";

    var Clock = function(startTime, stopTime, currentTime, clockStep, clockRange, multiplier) {
        this.startTime = startTime || new JulianDate();
        this.startTime = TimeStandard.convertUtcToTai(this.startTime);

        this.stopTime = stopTime || this.startTime.addDays(1);
        this.stopTime = TimeStandard.convertUtcToTai(this.stopTime);

        this.currentTime = currentTime || this.startTime;
        this.currentTime = TimeStandard.convertUtcToTai(this.currentTime);

        this.clockStep = clockStep || ClockStep.SYSTEM_CLOCK;

        this.clockRange = clockRange || ClockRange.UNBOUNDED;

        this.multiplier = multiplier || 1;

        this._lastCpuTime = new Date().getTime();

        this._lastCurrentTime = currentTime;
    };

    Clock.prototype.tick = function() {
        var startTime = this.startTime;
        var stopTime = this.stopTime;
        var currentTime = this.currentTime;
        var currentCpuTime = new Date().getTime();

        //If the user changed currentTime himself,
        //Don't update the time on this tick, instead
        //this tick indicates the user time is now
        //the current time.
        if (this._lastCurrentTime === currentTime) {
            if (this.clockStep === ClockStep.FRAME_DEPENDENT) {
                currentTime = currentTime.addSeconds(this.multiplier);
            } else {
                var milliseconds = currentCpuTime - this._lastCpuTime;
                currentTime = currentTime.addSeconds(this.multiplier * (milliseconds / 1000.0));
            }
        }

        if (this.clockRange === ClockRange.CLAMPED) {
            if (currentTime.lessThan(startTime)) {
                currentTime = startTime;
            } else if (currentTime.greaterThan(stopTime)) {
                currentTime = stopTime;
            }
        } else if (this.clockRange === ClockRange.LOOP) {
            while (currentTime.lessThan(startTime)) {
                currentTime = stopTime.addSeconds(startTime.getSecondsDifference(currentTime));
            }
            while (currentTime.greaterThan(stopTime)) {
                currentTime = startTime.addSeconds(stopTime.getSecondsDifference(currentTime));
            }
        }

        this.currentTime = this._lastCurrentTime = currentTime;
        this._lastCpuTime = currentCpuTime;
        return currentTime;
    };

    return Clock;
});