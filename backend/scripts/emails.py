from apscheduler.schedulers.blocking import BlockingScheduler
import os
import requests

sched = BlockingScheduler()


@sched.scheduled_job("cron", day_of_week="mon", hour=12)
def scheduled_job():
    url = os.environ.get(
        "WEEKLY_EMAILS_URL",
        "https://app.menteeglobal.org/api/notifications/weeklyemails",
    )
    r = requests.get(url)
    print(r.status_code)


if __name__ == "__main__":
    sched.start()
