"""
GitHub collector using REST API.

API Documentation: https://docs.github.com/en/rest/search
Rate Limit: 10 req/min (unauthenticated), 30 req/min (authenticated)

OPTIMIZED: Reduced delay times based on actual rate limits.
- Unauthenticated: 6.0s -> 2.0s (burst allowed within limits)
- Authenticated: 2.0s -> 1.0s
"""

import os
import logging
from datetime import date, timedelta
from typing import List, Dict, Optional

from .base import BaseCollector

logger = logging.getLogger(__name__)

# GitHub API endpoints
GITHUB_API_BASE = "https://api.github.com"
SEARCH_REPOS_URL = f"{GITHUB_API_BASE}/search/repositories"


class GitHubCollector(BaseCollector):
    """Collector for GitHub trending repositories with optimized delays."""

    # GitHub specific settings - OPTIMIZED delays
    REQUEST_DELAY = 2.0  # Reduced from 6.0s for unauthenticated (burst OK)
    MAX_RESULTS = 30
    MIN_STARS = 10  # Minimum stars to consider

    # Topics that indicate power semiconductor related repos
    RELEVANT_TOPICS = [
        "power-electronics", "semiconductor", "sic", "gan", "igbt", "mosfet",
        "ev", "electric-vehicle", "inverter", "power-supply",
        "embedded", "hardware", "fpga", "pcb", "electronics"
    ]

    def __init__(self):
        super().__init__()
        self.token = os.environ.get("GITHUB_TOKEN", "")

        if self.token:
            self.session.headers.update({
                "Authorization": f"token {self.token}",
                "Accept": "application/vnd.github.v3+json"
            })
            self.REQUEST_DELAY = 1.0  # OPTIMIZED: Faster with auth (was 2.0)
            logger.info("GitHub: Using authenticated mode (1.0s delay)")
        else:
            self.session.headers.update({
                "Accept": "application/vnd.github.v3+json"
            })
            logger.info("GitHub: Using unauthenticated mode (2.0s delay)")

    @property
    def source_name(self) -> str:
        return "github"

    def collect(self, target_date: Optional[date] = None) -> List[Dict]:
        """
        Collect trending repositories from GitHub.

        Args:
            target_date: Date to search from (default: yesterday)

        Returns:
            List of tool dictionaries
        """
        if target_date is None:
            target_date = date.today() - timedelta(days=1)

        logger.info(f"Collecting GitHub repositories created on/after {target_date}")

        tools = []

        try:
            # Search for recently created repos with good stars
            query = self._build_search_query(target_date)

            self._rate_limit()

            response = self.session.get(
                SEARCH_REPOS_URL,
                params={
                    "q": query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": self.MAX_RESULTS
                },
                timeout=30
            )

            # Handle rate limiting
            if response.status_code == 403:
                remaining = response.headers.get("X-RateLimit-Remaining", "0")
                if remaining == "0":
                    logger.warning("GitHub rate limit exceeded, skipping")
                    return []

            response.raise_for_status()
            data = response.json()

            items = data.get("items", [])
            logger.info(f"Found {len(items)} repositories from GitHub")

            for i, repo in enumerate(items, 1):
                stars = repo.get("stargazers_count", 0)

                # Skip if below threshold
                if stars < self.MIN_STARS:
                    continue

                name = repo.get("name", "")
                description = repo.get("description", "") or ""
                url = repo.get("html_url", "")
                homepage = repo.get("homepage", "")
                topics = repo.get("topics", [])

                # Use homepage as official URL if available, otherwise GitHub URL
                official_url = homepage if homepage and homepage.startswith("http") else url

                # Generate tagline from description
                tagline = description[:200] if description else f"GitHub: {name}"

                # Categorize
                categories = self._categorize_from_repo(name, description, topics)

                tool = self.create_tool_dict(
                    name=self._format_name(name),
                    tagline=tagline,
                    official_url=official_url,
                    categories=categories,
                    source_rank=i,
                    source_votes=stars,
                    description=description,
                    topics=topics,
                    extra_links={"github": url}
                )

                tools.append(tool)

            logger.info(f"Collected {len(tools)} tools from GitHub")

        except Exception as e:
            logger.error(f"Error collecting from GitHub: {e}")

        return tools

    def _build_search_query(self, target_date: date) -> str:
        """Build GitHub search query for power semiconductor related repos."""
        query_parts = [
            f"created:>={target_date.isoformat()}",
            f"stars:>={self.MIN_STARS}",
            "is:public"
        ]

        # Add topic filters for power semiconductor related repos
        query_parts.append(
            "(power OR semiconductor OR electronics OR embedded OR "
            "sic OR gan OR igbt OR mosfet OR inverter OR ev OR charger)"
        )

        return " ".join(query_parts)

    def _format_name(self, name: str) -> str:
        """Format repository name for display."""
        # Replace hyphens/underscores with spaces, title case
        formatted = name.replace("-", " ").replace("_", " ")

        # Handle common patterns
        formatted = formatted.replace(" sic", " SiC")
        formatted = formatted.replace(" gan", " GaN")
        formatted = formatted.replace(" igbt", " IGBT")
        formatted = formatted.replace(" mosfet", " MOSFET")
        formatted = formatted.replace(" ev", " EV")
        formatted = formatted.replace(" api", " API")
        formatted = formatted.replace(" cli", " CLI")

        # Title case
        return formatted.title()

    def _categorize_from_repo(self, name: str, description: str, topics: List[str]) -> List[str]:
        """Categorize based on repo metadata."""
        categories = []
        text = (name + " " + description + " " + " ".join(topics)).lower()

        # Power semiconductor category detection
        if any(kw in text for kw in ["sic", "silicon carbide"]):
            categories.append("sic")

        if any(kw in text for kw in ["gan", "gallium nitride"]):
            categories.append("gan")

        if any(kw in text for kw in ["igbt", "insulated gate"]):
            categories.append("igbt")

        if any(kw in text for kw in ["mosfet", "power mosfet"]):
            categories.append("mosfet")

        if any(kw in text for kw in ["ev", "electric vehicle", "charger", "charging"]):
            categories.append("ev")

        if any(kw in text for kw in ["inverter", "converter", "power supply"]):
            categories.append("inverter")

        if any(kw in text for kw in ["infineon", "wolfspeed", "onsemi", "rohm"]):
            categories.append("vendor")

        # Default to "other" if no match
        if not categories:
            categories.append("other")

        return list(set(categories))
