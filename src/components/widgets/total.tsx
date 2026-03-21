import { useAppState } from "@/ctx/state-provider"

const TotalWidget = () => {
    const { dashBoard, mobileView } = useAppState()

    return (
        <div className={`flex ${!mobileView && 'flex-col'} justify-between border-4 border-primary h-full bg-primary-foreground p-2`}>
            <div className={`font-extrabold ${mobileView ? 'text-xs' : 'text-md'}`}>TOTAL</div>
            <div className={`${mobileView ? 'text-2xl' : 'text-6xl'} my-auto`}>{dashBoard.metrics.total}</div>
        </div>
    )
}

export default TotalWidget;