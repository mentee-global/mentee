from apscheduler.schedulers.blocking import BlockingScheduler
import requests

sched = BlockingScheduler()


@sched.scheduled_job('cron', day_of_week='mon', hour=17)
def scheduled_job():
    # python requests
    r = requests.get('https://api.github.com/user', auth=('user', 'pass'))
    print(r.status_code)


sched.start()
