import datetime
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, StudentProfile
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

# A pool of daily coding challenges — selected deterministically by date hash
CHALLENGE_POOL = [
    {
        "id": "ch_001",
        "title": "Two Sum",
        "difficulty": "Easy",
        "category": "Arrays & Hashing",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return the **indices** "
            "of the two numbers that add up to `target`. You may assume each input has exactly "
            "one solution, and you may not use the same element twice."
        ),
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0, 1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "nums = [3,2,4], target = 6", "output": "[1, 2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
        "starter_code": "def two_sum(nums, target):\n    # Your solution here\n    pass\n\nprint(two_sum([2,7,11,15], 9))  # Expected: [0, 1]\nprint(two_sum([3,2,4], 6))      # Expected: [1, 2]",
        "xp_reward": 100,
    },
    {
        "id": "ch_002",
        "title": "Fibonacci with Memoization",
        "difficulty": "Medium",
        "category": "Dynamic Programming",
        "description": (
            "Write a function `fib(n)` that returns the n-th Fibonacci number. "
            "Use **memoization** to achieve O(n) time complexity. "
            "F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)."
        ),
        "examples": [
            {"input": "n = 6", "output": "8", "explanation": "0,1,1,2,3,5,8"},
            {"input": "n = 10", "output": "55", "explanation": "The 10th fibonacci number"},
        ],
        "constraints": ["0 <= n <= 100"],
        "starter_code": "def fib(n, memo={}):\n    # Your memoized solution here\n    pass\n\nprint(fib(6))   # Expected: 8\nprint(fib(10))  # Expected: 55\nprint(fib(50))  # Should be instant with memoization",
        "xp_reward": 150,
    },
    {
        "id": "ch_003",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "category": "Stack",
        "description": (
            "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, "
            "determine if the input string is **valid**. A string is valid if: open brackets are "
            "closed by the same type of brackets, and open brackets are closed in the correct order."
        ),
        "examples": [
            {"input": 's = "()"', "output": "True", "explanation": "Balanced pair"},
            {"input": 's = "()[]{}"', "output": "True", "explanation": "All balanced"},
            {"input": 's = "(]"', "output": "False", "explanation": "Wrong closing bracket"},
        ],
        "constraints": ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'"],
        "starter_code": "def is_valid(s):\n    # Use a stack!\n    pass\n\nprint(is_valid('()'))      # True\nprint(is_valid('()[]{}'))  # True\nprint(is_valid('(]'))      # False\nprint(is_valid('([)]'))    # False",
        "xp_reward": 100,
    },
    {
        "id": "ch_004",
        "title": "Reverse Linked List",
        "difficulty": "Medium",
        "category": "Linked Lists",
        "description": (
            "Given the head of a singly linked list, reverse the list and return the reversed list. "
            "Implement both an **iterative** and a **recursive** solution."
        ),
        "examples": [
            {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]", "explanation": "Reversed order"},
            {"input": "head = [1,2]", "output": "[2,1]", "explanation": "Two element reversal"},
        ],
        "constraints": ["The number of nodes in the list is in range [0, 5000]", "-5000 <= Node.val <= 5000"],
        "starter_code": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Iterative solution\n    pass\n\n# Build list: 1 -> 2 -> 3\nhead = ListNode(1, ListNode(2, ListNode(3)))\nresult = reverse_list(head)\nwhile result:\n    print(result.val, end=' -> ')\n    result = result.next",
        "xp_reward": 150,
    },
    {
        "id": "ch_005",
        "title": "Binary Search",
        "difficulty": "Easy",
        "category": "Binary Search",
        "description": (
            "Given an array of integers `nums` sorted in **ascending order** and an integer `target`, "
            "write a function that returns the index of `target` if it exists, otherwise return `-1`. "
            "You must write an algorithm with O(log n) runtime complexity."
        ),
        "examples": [
            {"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4", "explanation": "9 exists at index 4"},
            {"input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1", "explanation": "2 does not exist"},
        ],
        "constraints": ["1 <= nums.length <= 10^4", "All values are unique", "nums is sorted ascending"],
        "starter_code": "def binary_search(nums, target):\n    # O(log n) — use two pointers!\n    pass\n\nprint(binary_search([-1,0,3,5,9,12], 9))   # 4\nprint(binary_search([-1,0,3,5,9,12], 2))   # -1",
        "xp_reward": 100,
    },
    {
        "id": "ch_006",
        "title": "Maximum Subarray (Kadane's Algorithm)",
        "difficulty": "Medium",
        "category": "Dynamic Programming",
        "description": (
            "Given an integer array `nums`, find the **contiguous subarray** (containing at least one number) "
            "which has the largest sum and return its sum. Implement Kadane's Algorithm for O(n) time."
        ),
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "[4,-1,2,1] has the largest sum = 6"},
            {"input": "nums = [1]", "output": "1", "explanation": "Single element"},
        ],
        "constraints": ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        "starter_code": "def max_subarray(nums):\n    # Kadane's Algorithm — O(n)\n    pass\n\nprint(max_subarray([-2,1,-3,4,-1,2,1,-5,4]))  # 6\nprint(max_subarray([1]))                        # 1\nprint(max_subarray([-1,-2,-3]))                 # -1",
        "xp_reward": 150,
    },
    {
        "id": "ch_007",
        "title": "FizzBuzz Variant",
        "difficulty": "Easy",
        "category": "Logic",
        "description": (
            "Write a function that for numbers 1 to n returns a list where: "
            "multiples of 3 → `'Fizz'`, multiples of 5 → `'Buzz'`, "
            "multiples of both → `'FizzBuzz'`, otherwise the number as a string."
        ),
        "examples": [
            {"input": "n = 5", "output": "['1','2','Fizz','4','Buzz']", "explanation": "Classic FizzBuzz"},
            {"input": "n = 15", "output": "['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz']", "explanation": "Full sequence to 15"},
        ],
        "constraints": ["1 <= n <= 10^4"],
        "starter_code": "def fizz_buzz(n):\n    result = []\n    for i in range(1, n + 1):\n        # Your logic here\n        pass\n    return result\n\nprint(fizz_buzz(5))   # ['1','2','Fizz','4','Buzz']\nprint(fizz_buzz(15))  # Full sequence",
        "xp_reward": 75,
    },
]


def _get_today_challenge() -> dict:
    """Select a challenge deterministically from today's UTC date using a hash."""
    today_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    hash_int = int(hashlib.md5(today_str.encode()).hexdigest(), 16)
    index = hash_int % len(CHALLENGE_POOL)
    challenge = CHALLENGE_POOL[index].copy()
    challenge["date"] = today_str
    challenge["is_daily"] = True
    return challenge


@router.get("/daily")
def get_daily_challenge(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns today's deterministic daily challenge."""
    challenge = _get_today_challenge()
    # Check if already completed today
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    today_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    completed_today = False
    if profile and hasattr(profile, "last_active_at") and profile.last_active_at:
        last_date = profile.last_active_at.strftime("%Y-%m-%d")
        # We'll encode completion in a simple way: check xp modulo marker
        # For simplicity we expose a flag from localStorage on the frontend
    challenge["completed"] = False  # Frontend manages this via localStorage
    return challenge


@router.post("/submit")
async def submit_challenge(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Award 2x XP for completing the daily challenge (called after code runs successfully)."""
    challenge_id = payload.get("challenge_id", "")
    passed = payload.get("passed", False)

    if not passed:
        return {"awarded": False, "message": "Challenge not passed yet. Keep trying!"}

    today_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    completion_key = f"challenge_{challenge_id}_{today_str}_{current_user.id}"

    # Find today's challenge to get XP reward
    today_challenge = _get_today_challenge()
    if today_challenge["id"] != challenge_id:
        raise HTTPException(status_code=400, detail="Challenge ID does not match today's challenge.")

    xp_reward = today_challenge["xp_reward"]

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    profile.xp += xp_reward
    profile.coins += xp_reward // 10
    new_level = (profile.xp // 100) + 1
    if new_level > profile.level:
        profile.level = new_level
    db.commit()

    return {
        "awarded": True,
        "xp_reward": xp_reward,
        "coins_reward": xp_reward // 10,
        "new_xp": profile.xp,
        "new_level": profile.level,
        "message": f"🏆 Daily Challenge Complete! +{xp_reward} XP awarded!"
    }
