# backend/orders/utils.py
import math
from datetime import date

def get_기간_string(today: date) -> str:
    """
    오늘 날짜(today)를 기반으로 기간 문자열(YYYY.MM.N)을 반환합니다.
    N은 해당 월의 주차로, 주차는 "월요일이 한 주의 시작" 규칙에 따라 계산합니다.
    
    - 만약 월의 1일이 월요일이면: 1일부터 7일 → 1주차, 8일부터 14일 → 2주차, …  
    - 그렇지 않으면, 1일부터 첫 월요일 전까지는 1주차, 첫 월요일부터는 ceil((today.day + first_day.weekday())/7)
      로 계산합니다.
    """
    first_day = today.replace(day=1)
    # 만약 월 1일이 월요일이면 간단하게 계산
    if first_day.weekday() == 0:  # Monday
        week = ((today.day - 1) // 7) + 1
    else:
        # first_day.weekday()는 월요일=0 ~ 일요일=6
        # 예: 1일이 토요일(weekday=5)면, (1+5)=6/7 → ceil=1, (3+5)=8/7 → ceil=2
        week = math.ceil((today.day + first_day.weekday()) / 7)
    return f"{today.year}.{today.month:02d}.{week}"
