/**
 * Code to calculate the 'zero' of going forward (from (0, 180) to (MIN, MAX))
 */

//useful enums
enum VerticalDirection {
    Up = 1,
    Down = -1,
}

enum Pins {
    P1 = 1,
    P2
}

type Limits = { 
    MAX: number,
    MIN: number;
}

//you should know this from the Calibratior_90
const DEGREES_PER_SECOND = 270;

//some known constants
const HALF_TURN_DEGREES = 180;
const DISTANCE_PER_SECOND = 100;
const MS_PER_SECOND = 1e6;
const MICROSECONDS_TO_PAUSE = 5 * MS_PER_SECOND; //5 seconds per test

//limits of p1 and p2 (before they start turning back)
const P1_LIMITS : Limits = {
    MAX: 90,
    MIN: 0
};
const P2_LIMITS : Limits = {
    MAX: 180,
    MIN: 90
};

//initial outputs for p1 and p2
const INITIAL_P1_OUTPUT = 0;
const INITIAL_P2_OUTPUT = 180;

//initial jump step
const INITIAL_STEP_JUMP = 90;


//make sure pins begin at 0 speed
pins.servoWritePin(AnalogPin.P1, 90);
pins.servoWritePin(AnalogPin.P2, 90);

//initial message
basic.showString('Press A or B to begin')

/**
 * turn around
 */
const turnAround = () => {
    const timeToWait = HALF_TURN_DEGREES / DEGREES_PER_SECOND * MS_PER_SECOND;
    //turn
    pins.servoWritePin(AnalogPin.P1, 45);
    pins.servoWritePin(AnalogPin.P2, 45);
    control.waitMicros(timeToWait);

    //stop
    pins.servoWritePin(AnalogPin.P1, 90);
    pins.servoWritePin(AnalogPin.P2, 90);
}

//set current values
let currentP1Output = INITIAL_P1_OUTPUT;
let currentP2Output = INITIAL_P2_OUTPUT;
let currentStepJump = INITIAL_STEP_JUMP;
let currentVerticalDirection : VerticalDirection = undefined;
let pinThatNeedsChanging : Pins = undefined;

//value to store if we're at start
let firstTest = true;

/**
 * Move forward according to the distance in UNKNOWN UNITS!
 */
const testForward = () => {

    //wait half a second to allow hand to move away
    control.waitMicros(0.5*MS_PER_SECOND);
    turnAround();


    //get new test on P1
    pins.servoWritePin(AnalogPin.P1, currentP1Output);
    pins.servoWritePin(AnalogPin.P2, currentP2Output);

    control.waitMicros(MICROSECONDS_TO_PAUSE);

    //stop
    pins.servoWritePin(AnalogPin.P1, 90);
    pins.servoWritePin(AnalogPin.P2, 90);

    //turn around (we test on a line)
    control.waitMicros(MS_PER_SECOND); // pause for a second
    turnAround();
    control.waitMicros(MS_PER_SECOND); // pause for a second
    
}

const updateVerticalDirection = (direction: VerticalDirection) => {
    //check vertical direction is set
    if(!currentVerticalDirection) currentVerticalDirection = direction;

    //update step jump and direction if necessary
    if(currentVerticalDirection != direction) {
        currentStepJump = Math.ceil(currentStepJump / 2);
        currentVerticalDirection = -currentVerticalDirection;
    }
}

//P1 and P2 updaters
const updateP1PinValue = () => {
    //update p1 output
    let newP1Output = currentP1Output + (currentVerticalDirection * currentStepJump);

    //FOR NOW IF WE GO ABOVE LIMIT WE WILL JUST LEAVE IT AT LIMIT -> needs thinking
    if(newP1Output > P1_LIMITS.MAX)
        newP1Output = P1_LIMITS.MAX;
    if(newP1Output < P1_LIMITS.MIN)
        newP1Output = P1_LIMITS.MIN;

    //update current p1 output
    currentP1Output = newP1Output;
    basic.showNumber(currentP1Output);
}

const updateP2PinValue = () => {
    //update p2 output
    let newP2Output = currentP1Output + (currentVerticalDirection * currentStepJump);

    //FOR NOW IF WE GO ABOVE LIMIT WE WILL JUST LEAVE IT AT LIMIT -> needs thinking
    if(newP2Output >= P2_LIMITS.MAX)
        newP2Output = P2_LIMITS.MAX;
    if(newP2Output <= P2_LIMITS.MIN)
        newP2Output = P2_LIMITS.MIN;

    //update current p2 output
    currentP2Output = newP2Output;
    basic.showNumber(currentP2Output);
}

//update direction of change
//update necessary pin output
const updateOutputValue = (direction: VerticalDirection) => {

    //first update direction
    updateVerticalDirection(direction);

    //update pins values
    if(pinThatNeedsChanging === Pins.P1)
        updateP1PinValue();
    else updateP2PinValue();
}

// let microbit know that whenever a is pressed we ask it to move forward
input.onButtonPressed(Button.A, () => {

    //if first test just try going forward
    if(firstTest) {
        testForward();
        firstTest = false;
        //ask for direction
        basic.showString("A if veers left, B if veers right")
        return;
    }

    //if we don't know which pin needs changing, store P1
    if(!pinThatNeedsChanging) {
        pinThatNeedsChanging = Pins.P1;
        basic.showNumber(P1_LIMITS.MIN);
        return;
    }

    updateOutputValue(VerticalDirection.Up);
    testForward();
})

input.onButtonPressed(Button.B, () => {

    //if first test just try going forward
    if(firstTest) {
        testForward();
        firstTest = false;
        //ask for direction
        basic.showString("A if veers left, B if veers right")
        return;
    }

    //if we don't know which pin needs changing, store P2
    if(!pinThatNeedsChanging) {
        pinThatNeedsChanging = Pins.P2;
        basic.showNumber(P2_LIMITS.MAX);
        return;
    }

    updateOutputValue(VerticalDirection.Down);
    testForward();
})