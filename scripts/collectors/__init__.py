"""
Collectors package for Power-Semiconductor-News.

Each collector fetches data from a specific source (Product Hunt, Hacker News, GitHub).
"""

from .producthunt import ProductHuntCollector
from .hn import HackerNewsCollector
from .github import GitHubCollector

__all__ = ["ProductHuntCollector", "HackerNewsCollector", "GitHubCollector"]
