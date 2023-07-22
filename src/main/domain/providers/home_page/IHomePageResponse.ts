export type IHomePageResponse = {
  id: string
  promotedPracticeUid: string
  videoTags: string[]
  duration: number
  uid: string
  weeklySchedule: string
  milestone: {
    title: string
    subtitle: string
    buttonStart: string
    buttonContinue: string
    schedules: []
  }
}
