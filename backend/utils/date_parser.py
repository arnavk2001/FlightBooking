"""Date parsing utility to handle multiple date formats and convert to YYYY-MM-DD"""
import re
from datetime import datetime
from typing import Optional


class DateParser:
    """Parse dates in various formats and convert to YYYY-MM-DD"""
    
    MONTH_NAMES = {
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12
    }
    
    @staticmethod
    def parse_date(date_string: str) -> Optional[str]:
        """
        Parse date string in various formats and return YYYY-MM-DD format.
        
        Supported formats:
        - YYYY-MM-DD (2024-06-15)
        - DD/MM/YYYY (15/06/2024)
        - MM/DD/YYYY (06/15/2024)
        - DD-MM-YYYY (15-06-2024)
        - MM-DD-YYYY (06-15-2024)
        - DD.MM.YYYY (15.06.2024)
        - MM.DD.YYYY (06.15.2024)
        - "15th June 2024" or "15 June 2024"
        - "June 15, 2024" or "Jun 15, 2024"
        - "15/06" or "15-06" (assumes current year)
        - "June 15" or "15 June" (assumes current year)
        
        Returns:
            str: Date in YYYY-MM-DD format, or None if parsing fails
        """
        if not date_string:
            return None
        
        date_string = date_string.strip()
        
        # Try ISO format first (YYYY-MM-DD)
        try:
            datetime.strptime(date_string, "%Y-%m-%d")
            return date_string
        except ValueError:
            pass
        
        # Try DD/MM/YYYY or MM/DD/YYYY
        slash_pattern = r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
        match = re.search(slash_pattern, date_string)
        if match:
            part1, part2, year = match.groups()
            # Try DD/MM/YYYY first (European format)
            try:
                day, month = int(part1), int(part2)
                if 1 <= day <= 31 and 1 <= month <= 12:
                    date_obj = datetime(int(year), month, day)
                    return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                pass
            
            # Try MM/DD/YYYY (American format)
            try:
                month, day = int(part1), int(part2)
                if 1 <= month <= 12 and 1 <= day <= 31:
                    date_obj = datetime(int(year), month, day)
                    return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                pass
        
        # Try DD.MM.YYYY or MM.DD.YYYY
        dot_pattern = r'(\d{1,2})\.(\d{1,2})\.(\d{4})'
        match = re.search(dot_pattern, date_string)
        if match:
            part1, part2, year = match.groups()
            # Try DD.MM.YYYY first
            try:
                day, month = int(part1), int(part2)
                if 1 <= day <= 31 and 1 <= month <= 12:
                    date_obj = datetime(int(year), month, day)
                    return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                pass
            
            # Try MM.DD.YYYY
            try:
                month, day = int(part1), int(part2)
                if 1 <= month <= 12 and 1 <= day <= 31:
                    date_obj = datetime(int(year), month, day)
                    return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                pass
        
        # Try "15th June 2024" or "15 June 2024"
        ordinal_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})'
        match = re.search(ordinal_pattern, date_string, re.IGNORECASE)
        if match:
            day_str, month_str, year_str = match.groups()
            month_name = month_str.lower()
            if month_name in DateParser.MONTH_NAMES:
                try:
                    day = int(day_str)
                    month = DateParser.MONTH_NAMES[month_name]
                    year = int(year_str)
                    date_obj = datetime(year, month, day)
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        
        # Try "June 15, 2024" or "Jun 15, 2024"
        month_first_pattern = r'([a-z]+)\s+(\d{1,2}),?\s+(\d{4})'
        match = re.search(month_first_pattern, date_string, re.IGNORECASE)
        if match:
            month_str, day_str, year_str = match.groups()
            month_name = month_str.lower()
            if month_name in DateParser.MONTH_NAMES:
                try:
                    month = DateParser.MONTH_NAMES[month_name]
                    day = int(day_str)
                    year = int(year_str)
                    date_obj = datetime(year, month, day)
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        
        # Try "15th June" or "15 June" (no year, assume current or next year)
        ordinal_no_year_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)'
        match = re.search(ordinal_no_year_pattern, date_string, re.IGNORECASE)
        if match:
            day_str, month_str = match.groups()
            month_name = month_str.lower()
            if month_name in DateParser.MONTH_NAMES:
                try:
                    day = int(day_str)
                    month = DateParser.MONTH_NAMES[month_name]
                    now = datetime.now()
                    year = now.year
                    # If the date has already passed this year, use next year
                    try:
                        date_obj = datetime(year, month, day)
                        if date_obj < now:
                            year = year + 1
                        date_obj = datetime(year, month, day)
                        return date_obj.strftime("%Y-%m-%d")
                    except ValueError:
                        pass
                except ValueError:
                    pass
        
        # Try "June 15" (no year, assume current or next year)
        month_first_no_year_pattern = r'([a-z]+)\s+(\d{1,2})'
        match = re.search(month_first_no_year_pattern, date_string, re.IGNORECASE)
        if match:
            month_str, day_str = match.groups()
            month_name = month_str.lower()
            if month_name in DateParser.MONTH_NAMES:
                try:
                    month = DateParser.MONTH_NAMES[month_name]
                    day = int(day_str)
                    now = datetime.now()
                    year = now.year
                    # If the date has already passed this year, use next year
                    try:
                        date_obj = datetime(year, month, day)
                        if date_obj < now:
                            year = year + 1
                        date_obj = datetime(year, month, day)
                        return date_obj.strftime("%Y-%m-%d")
                    except ValueError:
                        pass
                except ValueError:
                    pass
        
        # Try DD/MM or MM/DD (no year, assume current or next year)
        short_pattern = r'(\d{1,2})[/-](\d{1,2})'
        match = re.search(short_pattern, date_string)
        if match:
            part1, part2 = match.groups()
            now = datetime.now()
            year = now.year
            
            # Try DD/MM first (European format)
            try:
                day, month = int(part1), int(part2)
                if 1 <= day <= 31 and 1 <= month <= 12:
                    try:
                        date_obj = datetime(year, month, day)
                        if date_obj < now:
                            year = year + 1
                        date_obj = datetime(year, month, day)
                        return date_obj.strftime("%Y-%m-%d")
                    except ValueError:
                        pass
            except ValueError:
                pass
            
            # Try MM/DD (American format)
            try:
                month, day = int(part1), int(part2)
                if 1 <= month <= 12 and 1 <= day <= 31:
                    try:
                        date_obj = datetime(year, month, day)
                        if date_obj < now:
                            year = year + 1
                        date_obj = datetime(year, month, day)
                        return date_obj.strftime("%Y-%m-%d")
                    except ValueError:
                        pass
            except ValueError:
                pass
        
        return None
    
    @staticmethod
    def validate_date_format(date_string: str) -> bool:
        """Validate if date string is in YYYY-MM-DD format"""
        try:
            datetime.strptime(date_string, "%Y-%m-%d")
            return True
        except ValueError:
            return False

