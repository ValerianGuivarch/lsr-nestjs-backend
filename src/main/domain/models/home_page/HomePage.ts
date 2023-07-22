export class HomePage {
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
    schedules: string[]
  }

  constructor(p: {
    id: string
    promotedPracticeUid: string
    videoTags: string[]
    duration: number
    uid: string
    weeklySchedule: string
    milestone: { title: string; subtitle: string; buttonStart: string; buttonContinue: string; schedules: string[] }
  }) {
    this.id = p.id
    this.promotedPracticeUid = p.promotedPracticeUid
    this.videoTags = p.videoTags
    this.duration = p.duration
    this.uid = p.uid
    this.weeklySchedule = p.weeklySchedule
    this.milestone = p.milestone
  }
}
