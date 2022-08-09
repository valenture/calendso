import type { TFunction } from "next-i18next";

import dayjs from "@calcom/dayjs";
import { BookingInfo } from "@calcom/features/ee/workflows/lib/reminders/smsReminderManager";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";

import {
  BaseEmailHtml,
  CustomInputs,
  Info,
  LocationInfo,
  ManageLink,
  WhenInfo,
  WhoInfo,
} from "../components";

export const BaseScheduledEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
    timeZone: string;
    t: TFunction;
  } & Partial<React.ComponentProps<typeof BaseEmailHtml>>
) => {
  const { t, timeZone } = props;

  function getRecipientStart(format: string) {
    return dayjs(props.calEvent.startTime).tz(timeZone).format(format);
  }

  function getRecipientEnd(format: string) {
    return dayjs(props.calEvent.endTime).tz(timeZone).format(format);
  }

  function hideMakeChange(
    bookingInfo: { attendees: string | unknown[]; user: { email: string } },
    attendeeEmail: string
  ) {
    const isGroupBooking = (bookingInfo && bookingInfo?.attendees.length > 1) || false;
    const isOwner = (bookingInfo && bookingInfo?.user && bookingInfo?.user.email == attendeeEmail) || false;
    let hideMakeChange = false;

    if (isOwner && isGroupBooking) {
      hideMakeChange = false;
    } else if (!isOwner && isGroupBooking) {
      // if is group booking and user is not owner
      hideMakeChange = true;
    } else if (isOwner && !isGroupBooking) {
      // if not group booking and user is owner
      hideMakeChange = false;
    } else if (!isOwner && !isGroupBooking) {
      // if not owner and not group booking
      hideMakeChange = false;
    }

    return hideMakeChange;
  }

  const subject = t(props.subject || "confirmed_event_type_subject", {
    eventType: props.calEvent.type,
    name: props.calEvent.team?.name || props.calEvent.organizer.name,
    date: `${getRecipientStart("h:mma")} - ${getRecipientEnd("h:mma")}, ${t(
      getRecipientStart("dddd").toLowerCase()
    )}, ${t(getRecipientStart("MMMM").toLowerCase())} ${getRecipientStart("D, YYYY")}`,
  });

  return (
    <BaseEmailHtml
      headerType={props.headerType || "checkCircle"}
      subject={props.subject || subject}
      title={t(
        props.title
          ? props.title
          : props.calEvent.recurringEvent?.count
          ? "your_event_has_been_scheduled_recurring"
          : "your_event_has_been_scheduled"
      )}
      callToAction={
        props.callToAction === null
          ? null
          : props.callToAction || <ManageLink attendee={props.attendee} calEvent={props.calEvent} />
      }
      subtitle={props.subtitle || <>{t("emailed_you_and_any_other_attendees")}</>}>
      <Info label={t("cancellation_reason")} description={props.calEvent.cancellationReason} withSpacer />
      <Info label={t("rejection_reason")} description={props.calEvent.rejectionReason} withSpacer />
      <Info label={t("what")} description={props.calEvent.type} withSpacer />
      <WhenInfo calEvent={props.calEvent} t={t} timeZone={timeZone} />
      <WhoInfo calEvent={props.calEvent} t={t} recieverEmail={props.attendee.email} />
      <LocationInfo calEvent={props.calEvent} t={t} />
      <Info label={t("description")} description={props.calEvent.description} withSpacer />
      <Info label={t("additional_notes")} description={props.calEvent.additionalNotes} withSpacer />
      <CustomInputs calEvent={props.calEvent} />
    </BaseEmailHtml>
  );
};
