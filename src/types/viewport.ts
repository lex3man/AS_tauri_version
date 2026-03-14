export class ViewPort {
    constructor(
        public name: string,
        private active: boolean,
        public type?: string,
    ) {}

    activate() {
        this.active = true
    }

    deactivate() {
        this.active = false
    }

    isActive(): boolean {
        return this.active
    }

    static new(name: string, type?: string): ViewPort {
        return new ViewPort(name, false, type)
    }
}