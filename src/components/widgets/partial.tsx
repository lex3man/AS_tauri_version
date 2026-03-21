import { useAppState } from "@/ctx/state-provider"
import { useState } from "react"

const PartialWidget = () => {
    const { mobileView } = useAppState()
    const [counter, setCounter] = useState(0)

    return (
        <div className={`flex ${!mobileView && 'flex-col'} justify-between border-4 border-primary h-full bg-primary-foreground p-2`} onClick={() => setCounter(counter+1)}>
            <div className={`font-extrabold ${mobileView ? 'text-xs' : 'text-md'}`}>PARTIAL</div>
            <div className={`${mobileView ? 'text-2xl' : 'text-6xl'} my-auto`}>{counter}</div>
        </div>
    )
}

export default PartialWidget;