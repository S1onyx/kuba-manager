import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useScoreboardFeed } from '../hooks/useScoreboardFeed.js';
import { usePublicTournaments } from '../hooks/usePublicTournaments.js';
import { useTournamentSummary } from '../hooks/useTournamentSummary.js';
import { SUMMARY_TABS } from '../constants/tabs.js';
import { resolveInitialRoute } from '../utils/navigation.js';
import { scorecardHasGroup } from '../utils/summary.js';
import { trackEvent, trackPageview } from '../utils/plausible.js';

const PublicAppContext = createContext(null);

export function PublicAppProvider({ children }) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState('live');
  const [showImpressum, setShowImpressum] = useState(false);
  const [route, setRoute] = useState(() => resolveInitialRoute());

  const selectedTournamentRef = useRef(null);
  const lastScoreboardTournamentIdRef = useRef(null);
  const liveTabAutoRef = useRef({ lastApplied: null, suppressed: null });

  const navigate = useCallback((hash) => {
    const target = typeof hash === 'string' && hash.startsWith('#/') ? hash : '#/';
    if (typeof window === 'undefined') {
      setRoute(target);
      return;
    }
    if (window.location.hash !== target) {
      window.location.hash = target;
    } else {
      setRoute(target);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleHashChange = () => {
      setRoute(resolveInitialRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo(0, 0);
  }, [route]);

  const isReglementView = route === '#/reglement';

  const handleNavigateHome = useCallback(() => {
    trackEvent('Navigation', {
      target: 'overview',
      route: '#/'
    });
    navigate('#/');
  }, [navigate]);

  const handleNavigateReglement = useCallback(() => {
    trackEvent('Navigation', {
      target: 'reglement',
      route: '#/reglement'
    });
    navigate('#/reglement');
  }, [navigate]);

  const {
    publicTournaments,
    error: tournamentsError,
    loading: loadingTournaments,
    refresh: refreshPublicTournaments
  } = usePublicTournaments();

  const {
    summary: tournamentSummary,
    error: summaryError,
    loading: loadingSummary,
    refresh: refreshSummary
  } = useTournamentSummary(selectedTournamentId);

  const handleScoreboardEvent = useCallback(
    (payload) => {
      refreshPublicTournaments();
      const activeId = selectedTournamentRef.current || payload?.tournamentId || null;
      trackEvent('Scoreboard Update', {
        tournamentId: payload?.tournamentId ?? activeId ?? 'unknown',
        eventType: payload?.type ?? 'unknown'
      });
      if (activeId) {
        refreshSummary(activeId);
      }
    },
    [refreshPublicTournaments, refreshSummary]
  );

  const {
    scoreboard,
    currentGroupStandings,
    recordedGamesCount,
    currentTournamentMeta,
    error: currentError
  } = useScoreboardFeed({ onScoreboardEvent: handleScoreboardEvent });

  const handleTournamentSelect = useCallback(
    (id) => {
      if (id === selectedTournamentId) {
        return;
      }

      if (id) {
        const tournament = publicTournaments.find((item) => item.id === id) ?? null;
        trackEvent('Tournament Selected', {
          tournamentId: id,
          tournamentName: tournament?.name ?? 'unknown'
        });
      } else {
        trackEvent('Tournament Selection Cleared');
      }

      setSelectedTournamentId(id);
    },
    [publicTournaments, selectedTournamentId]
  );

  useEffect(() => {
    selectedTournamentRef.current = selectedTournamentId ?? null;
  }, [selectedTournamentId]);

  const scoreboardPublic = useMemo(() => {
    const activeId = scoreboard?.tournamentId ?? currentTournamentMeta?.id ?? null;
    if (!activeId) {
      return true;
    }

    if (currentTournamentMeta && currentTournamentMeta.id === activeId) {
      return Boolean(currentTournamentMeta.is_public);
    }

    return publicTournaments.some((tournament) => tournament.id === activeId);
  }, [scoreboard?.tournamentId, currentTournamentMeta, publicTournaments]);

  useEffect(() => {
    const activeIdCandidate = scoreboard?.tournamentId ?? currentTournamentMeta?.id ?? null;
    const scoreboardId = scoreboardPublic && activeIdCandidate ? activeIdCandidate : null;

    setSelectedTournamentId((prev) => {
      if (scoreboardId) {
        if (lastScoreboardTournamentIdRef.current !== scoreboardId) {
          lastScoreboardTournamentIdRef.current = scoreboardId;
          return scoreboardId;
        }

        if (prev && publicTournaments.some((tournament) => tournament.id === prev)) {
          return prev;
        }

        if (publicTournaments.some((tournament) => tournament.id === scoreboardId)) {
          return scoreboardId;
        }
      } else {
        lastScoreboardTournamentIdRef.current = null;
      }

      if (prev && publicTournaments.some((tournament) => tournament.id === prev)) {
        return prev;
      }

      return publicTournaments.length > 0 ? publicTournaments[0].id : null;
    });
  }, [scoreboard?.tournamentId, currentTournamentMeta, scoreboardPublic, publicTournaments]);

  useEffect(() => {
    setActiveSummaryTab('live');
    liveTabAutoRef.current = { lastApplied: null, suppressed: null };
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!scoreboardPublic) {
      liveTabAutoRef.current = { lastApplied: null, suppressed: null };
      return;
    }
    const activeTournamentId = scoreboard?.tournamentId ?? null;
    if (!activeTournamentId) {
      return;
    }
    if (activeTournamentId !== selectedTournamentId) {
      return;
    }
    if (activeSummaryTab === 'live') {
      liveTabAutoRef.current.lastApplied = activeTournamentId;
      return;
    }
    if (liveTabAutoRef.current.suppressed === activeTournamentId) {
      return;
    }
    if (liveTabAutoRef.current.lastApplied === activeTournamentId) {
      return;
    }
    liveTabAutoRef.current.lastApplied = activeTournamentId;
    setActiveSummaryTab('live');
  }, [scoreboardPublic, scoreboard?.tournamentId, selectedTournamentId, activeSummaryTab]);

  const handleSummaryTabSelect = useCallback(
    (tabId) => {
      trackEvent('Summary Tab Selected', {
        tab: tabId,
        tournamentId: selectedTournamentId ?? 'none'
      });

      if (tabId === 'live') {
        liveTabAutoRef.current = {
          lastApplied: scoreboard?.tournamentId ?? selectedTournamentId ?? null,
          suppressed: null
        };
      } else {
        liveTabAutoRef.current = {
          lastApplied: liveTabAutoRef.current.lastApplied,
          suppressed: selectedTournamentId ?? null
        };
      }
      setActiveSummaryTab(tabId);
    },
    [scoreboard?.tournamentId, selectedTournamentId]
  );

  useEffect(() => {
    if (!showImpressum) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showImpressum]);

  const openImpressum = useCallback(() => {
    if (!showImpressum) {
      trackEvent('Impressum Opened');
    }
    setShowImpressum(true);
  }, [showImpressum]);

  const closeImpressum = useCallback(() => {
    if (showImpressum) {
      trackEvent('Impressum Closed');
    }
    setShowImpressum(false);
  }, [showImpressum]);

  const currentCardData = scoreboardPublic ? scoreboard : null;
  const showPrivateNotice =
    Boolean(scoreboard?.tournamentId ?? currentTournamentMeta?.id) && !scoreboardPublic;

  const selectedTournament = useMemo(
    () => publicTournaments.find((tournament) => tournament.id === selectedTournamentId) ?? null,
    [publicTournaments, selectedTournamentId]
  );

  const selectedTournamentName = selectedTournament?.name ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const normalizedPath =
      route === '#/' || route === null ? '/' : `/${String(route).replace(/^#\//, '')}`;
    trackPageview(normalizedPath, {
      view: isReglementView ? 'reglement' : 'overview',
      summaryTab: activeSummaryTab,
      tournamentId: selectedTournamentId ?? 'none',
      tournamentName: selectedTournamentName ?? 'unknown'
    });
  }, [route, isReglementView, activeSummaryTab, selectedTournamentId, selectedTournamentName]);

  const showCurrentGroup = useMemo(
    () =>
      scorecardHasGroup(
        scoreboard,
        recordedGamesCount,
        currentGroupStandings,
        scoreboardPublic
      ),
    [scoreboard, recordedGamesCount, currentGroupStandings, scoreboardPublic]
  );

  const value = useMemo(
    () => ({
      route,
      isReglementView,
      navigation: {
        navigate,
        goHome: handleNavigateHome,
        goReglement: handleNavigateReglement
      },
      impressum: {
        visible: showImpressum,
        open: openImpressum,
        close: closeImpressum
      },
      tournaments: {
        list: publicTournaments,
        selectedId: selectedTournamentId,
        select: handleTournamentSelect,
        loading: loadingTournaments,
        error: tournamentsError
      },
      summary: {
        tabs: SUMMARY_TABS,
        activeTab: activeSummaryTab,
        selectTab: handleSummaryTabSelect,
        tournamentSummary,
        loading: loadingSummary,
        error: summaryError,
        showCurrentGroup,
        currentCardData,
        selectedTournament,
        showPrivateNotice,
        scoreboardPublic
      },
      scoreboardState: {
        scoreboard,
        currentGroupStandings,
        recordedGamesCount,
        currentTournamentMeta,
        error: currentError
      }
    }),
    [
      route,
      isReglementView,
      navigate,
      handleNavigateHome,
      handleNavigateReglement,
      showImpressum,
      openImpressum,
      closeImpressum,
      publicTournaments,
      selectedTournamentId,
      handleTournamentSelect,
      loadingTournaments,
      tournamentsError,
      activeSummaryTab,
      handleSummaryTabSelect,
      tournamentSummary,
      loadingSummary,
      summaryError,
      showCurrentGroup,
      currentCardData,
      selectedTournament,
      showPrivateNotice,
      scoreboardPublic,
      scoreboard,
      currentGroupStandings,
      recordedGamesCount,
      currentTournamentMeta,
      currentError
    ]
  );

  return <PublicAppContext.Provider value={value}>{children}</PublicAppContext.Provider>;
}

export function usePublicApp() {
  const context = useContext(PublicAppContext);
  if (!context) {
    throw new Error('usePublicApp must be used within a PublicAppProvider');
  }
  return context;
}
