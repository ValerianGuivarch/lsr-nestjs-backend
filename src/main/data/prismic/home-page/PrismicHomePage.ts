import { PrismicDocument } from '@prismicio/client/src/types/value/document'
import { asText } from '@prismicio/richtext'

export class PrismicHomePage {
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
    milestone: {
      title: string
      subtitle: string
      buttonStart: string
      buttonContinue: string
      schedules: []
    }
  }) {
    this.id = p.id
    this.promotedPracticeUid = p.promotedPracticeUid
    this.videoTags = p.videoTags
    this.duration = p.duration
    this.uid = p.uid
    this.weeklySchedule = p.weeklySchedule
    this.milestone = p.milestone
  }

  static createPrismicHomePage(document: PrismicDocument): PrismicHomePage {
    const data = document['data']
    return new PrismicHomePage({
      id: document.id,
      promotedPracticeUid: data['promoted_practice_link']['uid'],
      videoTags: data['video_tags'].map((elem) => {
        return elem['video_tag']
      }),
      duration: data['duration'],
      uid: document['uid'],
      weeklySchedule: data['weekly_schedule_link']['id'],
      milestone: {
        title: data['milestone_title'],
        subtitle: data['milestone_subtitle'],
        buttonStart: asText(data['milestone_button_start']),
        buttonContinue: asText(data['milestone_button_continue']),
        schedules: data['schedules'].map((milestone) => {
          return milestone['schedule_link']['uid']
        })
      }
    })
  }
}
