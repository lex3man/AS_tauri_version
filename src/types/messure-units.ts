export class Meters {
    constructor(public value: number) {}
    
    toKilometers(): number {
        return this.value / 1000;
    }

    static from(value: number): Meters {
        return new Meters(value);
    }
}

export class Kilometers {
    constructor(public value: number) {}
    
    toMeters(): number {
        return this.value * 1000;
    }

    static from(value: number): Kilometers {
        return new Kilometers(value);
    }
}