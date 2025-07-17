from enum import Enum

MENTOR_APPT_TEMPLATE = "d-3a2b51466e6541ffa052a197ced08c18"
MENTEE_APPT_TEMPLATE = "d-2ce963b36c91457c89c916a111d658bd"
USER_VERIFICATION_TEMPLATE = "d-7bd09ab8f8484cee9227a9a25ad527ec"
USER_FORGOT_PASSWORD_TEMPLATE = "d-df1adcced8ab461ca72ceae5eecfc566"
MENTOR_APP_OFFER = "d-3a7a5db2cf4e412e9e68e729a7b52813"
MENTOR_CONTACT_ME = "d-d6c6d8f33c3b4970937a9dbd85f97d1a"
WEEKLY_NOTIF_REMINDER = "d-9155757f51f14d538a613881bf0211d6"
MENTOR_APP_SUBMITTED = "d-753727e2c7df4509b251a576645d829a"
MENTEE_APP_SUBMITTED = "d-e4106f84494a44a58c81916c509b351c"
MENTOR_APP_REJECTED = "d-5158980fcf9a4247b018ef0d832d796c"
APP_APROVED = "d-0948fea82e3c4f9981ded9a27103fb62"
TRAINING_COMPLETED = "d-acf4c50c1e454fb0adc33b5c41800650"
PROFILE_COMPLETED = "d-45980b6e8f3441d29c71a5b2e6d67fe6"
UNREAD_MESSAGE_TEMPLATE = "d-7c75b1b696bb49a7850430d6a1b81ad4"
GROUPCHAT_TAGGED_MESSAGE_TEMPLATE = "d-468dd7f1d116462da7ec0bf02be5e1d1"
NEW_TRAINING_TEMPLATE = "d-0716a65e079843b59eef281809e07f5b"
SEND_INVITE_TEMPLATE = "d-f6405bbbafd144efa76a58814ac2f8f3"
ALERT_TO_ADMINS = "d-1808cac1e196446ca8be2ef3ecf93bdb"
EVENT_TEMPLATE = "d-5be889d30c0b40aebfa3b569aa5b40f0"
NEW_ANNOUNCE_TEMPLATE = "d-a3c4f9ee95544df48d771b8336357ed6"
NEW_GROUPCHAT_TEMPLATE = "d-6edceb23368244a2951b99624920a0bf"
REPLY_GROUPCHAT_TEMPLATE = "d-4027a86a55384ed696a3b812e11f7316"



APPT_TIME_FORMAT = "%m-%d-%Y at %I:%M%p"


MENTOR_ROLE = "mentor"
MENTEE_ROLE = "mentee"
ADMIN_ROLE = "admin"
PARTNER_ROLE = "partner"


NEW_APPLICATION_STATUS = {
    "PENDING": "PENDING",
    "APPROVED": "APPROVED",
    "BUILDPROFILE": "BuildProfile",
    "COMPLETED": "COMPLETED",
    "REJECTED": "REJECTED",
}


EDUCATION_LEVEL = {
    "elementary": "Elementary school",
    "high": "High school",
    "technical": "Technical school",
    "bachelor": "Bachelor",
    "masters": "Master",
    "doctorate": "Doctorate",
}


class Account(Enum):
    ADMIN = 0
    MENTOR = 1
    MENTEE = 2
    PARTNER = 3
    GUEST = 4
    SUPPORT = 5
    HUB = 6
    MODERATOR = 7

    def __eq__(self, other):
        if isinstance(other, Account):
            return self.value == other.value
        return self.value == other

    def __int__(self):
        return self.value

    def __hash__(self):
        return hash(self.value)



MENTOR_APP_STATES = {
    "PENDING": "Pending",
    "REVIEWED": "Reviewed",
    "REJECTED": "Rejected",
    "OFFER_MADE": "Offer Made",
}
TRAINING_TYPE = {"LINK": "LINK", "VIDEO": "VIDEO", "DOCUMENT": "DOCUMENT"}

APPT_STATUS = {
    "PENDING": "pending",
    "DENIED": "denied",
    "ACCEPTED": "accepted",
    "REJECTED": "Rejected",
}

TARGET_LANGS = {
    "es-US",
    "pt-BR",
    "ar",
    "fa-AF",
}

TRANSLATIONS = {
    "en-US": {
        "unread_message": "MENTEE: You have received a new Message!",
        "weekly_notif": "MENTEE: You Have Unread Messages",
        "new_training": "MENTEE! New training materials available",
        "new_event": "MENTEE! New event was created",
        "mentor_contact_me": "Mentor: A Mentee has requested to contact you",
        "verify_email": "MENTEE Email Verification",
        "forgot_password": "MENTEE Password Reset",
        "send_invite": "Mentee Appointment Appointment Invite",
        "mentee_appt": "Mentor Appointment Request",
        "mentor_appt": "Mentee Appointment Request",
        "mentor_app_submit": "MENTEE Application Status",
        "mentee_app_submit": "MENTEE Application Status",
        "app_approved": "MENTEE Application Status - Approved",
        "training_complete": "Congratulations for completing the training",
        "app_rejected": "Thank you for your interest in MENTEE",
        "profile_complete": "MENTEE Profile Completed - Please login",
        "new_group_message": "A new group chat message was added !",
        "reply_group_message": "A new reply has been added to a group chat message !",
    },
    "es-US": {
        "unread_message": "MENTEE: ¡Has recibido un nuevo mensaje!",
        "weekly_notif": "MENTEE: Tienes mensajes sin leer",
        "new_training": "¡MENTEE! Nuevos materiales de capacitación disponibles",
        "new_event": "¡MENTEE! Se creó un nuevo evento",
        "mentor_contact_me": "Mentor: Un mentee ha solicitado ponerse en contacto contigo",
        "verify_email": "Verificación de correo electrónico de mentee",
        "forgot_password": "Restablecimiento de contraseña de mentee",
        "send_invite": "Invitación a cita de mentee",
        "mentee_appt": "Solicitud de cita de mentor",
        "mentor_appt": "Solicitud de cita de mentee",
        "mentor_app_submit": "Estado de la solicitud de MENTEE",
        "mentee_app_submit": "Estado de la solicitud de MENTEE",
        "app_approved": "Estado de la solicitud de MENTEE - Aprobada",
        "training_complete": "Felicitaciones por completar la capacitación",
        "app_rejected": "Gracias por tu interés en MENTEE",
        "profile_complete": "Perfil de MENTEE completado: por favor, inicia sesión",
        "new_group_message": "Se agregó un nuevo mensaje de chat grupal.",
        "reply_group_message": "Se agregó una nueva respuesta a un mensaje de chat grupal.",
    },
    "pt-BR": {
        "unread_message": "MENTEE: Você recebeu uma nova mensagem!",
        "weekly_notif": "MENTEE: Você tem mensagens não lidas",
        "new_training": "MENTEE! Novos materiais de treinamento disponíveis",
        "new_event": "MENTEE! Novo evento foi criado",
        "mentor_contact_me": "Mentor: Um Mentee solicitou entrar em contato com você",
        "verify_email": "Verificação de e-mail do Mentee",
        "forgot_password": "Redefinição de senha do Mentee",
        "send_invite": "Convite para agendamento do Mentee",
        "mentee_appt": "Solicitação de agendamento do Mentor",
        "mentor_appt": "Solicitação de agendamento do Mentee",
        "mentor_app_submit": "Status da solicitação de MENTEE",
        "mentee_app_submit": "Status da solicitação de MENTEE",
        "app_approved": "Status da solicitação de MENTEE - Aprovado",
        "training_complete": "Parabéns por concluir o treinamento",
        "app_rejected": "Obrigado pelo seu interesse em MENTEE",
        "profile_complete": "Perfil de MENTEE completo - Faça login, por favor",
        "new_group_message": "Uma nova mensagem de bate-papo em grupo foi adicionada",
        "reply_group_message": "Uma nova resposta foi adicionada a uma mensagem de bate-papo em grupo",
    },
    "ar": {
        "unread_message": "متدرب: لديك رسالة جديدة!",
        "weekly_notif": "متدرب: لديك رسائل غير مقروءة",
        "new_training": "MENTEE! مواد تدريبية جديدة متاحة",
        "new_event": "MENTEE! تم إنشاء حدث جديد",
        "mentor_contact_me": "مرشد: طلب أحد المتدربين الاتصال بك",
        "verify_email": "تحقق من بريد المتدرب الإلكتروني",
        "forgot_password": "إعادة تعيين كلمة مرور المتدرب",
        "send_invite": "دعوة موعد المتدرب",
        "mentee_appt": "طلب موعد مع المرشد",
        "mentor_appt": "طلب موعد مع المتدرب",
        "mentor_app_submit": "حالة طلب MENTEE",
        "mentee_app_submit": "حالة طلب MENTEE",
        "app_approved": "حالة طلب MENTEE - تمت الموافقة",
        "training_complete": "تهانينا على إتمام التدريب",
        "app_rejected": "شكرًا لاهتمامك في MENTEE",
        "profile_complete": "الملف الشخصي لـ MENTEE مكتمل - يرجى تسجيل الدخول",
        "new_group_message": "تمت إضافة رسالة دردشة جماعية جديدة.",
        "reply_group_message": "تمت إضافة رد جديد على رسالة دردشة جماعية.",
    },
    "fa-AF": {
        "unread_message": "منتی: شما یک پیام جدید دریافت کرده اید!",
        "weekly_notif": "منتی: شما پیام های خوانده نشده دارید",
        "new_training": "منتی! منابع آموزشی جدید در دسترس است",
        "new_event": "رویداد جدید ایجاد شد!MENTEE",
        "mentor_contact_me": "مربی: یک منتی درخواست تماس با شما داشته است",
        "verify_email": "تأیید ایمیل منتی",
        "forgot_password": "بازیابی رمز عبور منتی",
        "send_invite": "دعوت به قرار ملاقات منتی",
        "mentee_appt": "درخواست قرار مربی",
        "mentor_appt": "درخواست قرار منتی",
        "mentor_app_submit": "وضعیت درخواست منتی",
        "mentee_app_submit": "وضعیت درخواست منتی",
        "app_approved": "وضعیت درخواست منتی - تایید شده",
        "training_complete": "تبریک بابت تکمیل آموزش",
        "app_rejected": "از علاقه‌مندی شما در منتی سپاسگزاریم",
        "profile_complete": "پروفایل منتی کامل شده است - لطفا وارد شوید",
        "new_group_message": "یک پیام جدید به چت گروهی اضافه شد",
        "reply_group_message": "پاسخ جدیدی به یک پیام چت گروهی اضافه شد",
    },
}

TRANSLATION_COST_PER_PAGE = 0.08

N50_ID_DEV = "675985b41684c4310ac00e4c"
N50_ID_PROD = "673629a96d37195fa12e2a51"
