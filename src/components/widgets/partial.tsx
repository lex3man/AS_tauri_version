import { useAppState } from "@/ctx/state-provider"
import { useState } from "react"

const PartialWidget = () => {
    const { mobileView } = useAppState()
    const [counter, setCounter] = useState(0)

    return (
        <div className={`flex ${!mobileView && 'flex-col'} justify-between border-4 border-primary h-full bg-primary-foreground p-2`} onClick={() => setCounter(counter+1)}>
            <div className={`font-extrabold ${mobileView ? 'text-xs' : 'text-md'}`}>PARTIAL</div>
            <div className={`${mobileView ? 'text-2xl' : 'text-[clamp(1.5rem,5vw,4rem)]'} my-auto leading-none`}>{counter}</div>
        </div>
    )
}

export default PartialWidget;