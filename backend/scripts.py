from subprocess import check_call

def runserver() -> None:
    check_call(["python", "manage.py", "runserver"])

def runprod():
    check_call(["python", "manage.py", "runprod"])

def runworker():
    check_call(["python", "manage.py", "runworker"])
