// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

const RARITY_BORDER = { common: 'var(--rule)', rare: '#4c8bf5', epic: '#9b5de5', legendary: '#f6c445' }
const RARITY_INK = { common: 'var(--muted)', rare: '#2d6ad6', epic: '#7b3fd1', legendary: '#a8740a' }
const RARITY_LABEL = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' }

export class RewardsLogic extends DCLogic {
  state = { s: null, w: null, slot: 'frame', shown: 0, opening: false, toast: '', toastKey: 0, gearKey: 0, burst: false }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      const w = D.wallet(s.crew.id)
      this.setState({ s, w })
      setTimeout(() => D.reveal(), 60)
      this.animateCoins(0, w.coins)
      this.off = D.onState(() => { const s2 = D.getState(), w2 = D.wallet(s2.crew.id); const from = this.state.shown; this.setState({ s: s2, w: w2 }); this.animateCoins(from, w2.coins) })
    })
  }
  componentWillUnmount() { this.off && this.off(); cancelAnimationFrame(this.raf); clearTimeout(this.t1) }
  animateCoins(from, to) {
    cancelAnimationFrame(this.raf)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return this.setState({ shown: to })
    const start = performance.now()
    const tick = (t) => { const p = Math.min(1, (t - start) / 900); this.setState({ shown: Math.round(from + (to - from) * (1 - (1 - p) ** 3)) }); if (p < 1) this.raf = requestAnimationFrame(tick) }
    this.raf = requestAnimationFrame(tick)
  }
  say(t) { this.setState((p) => ({ toast: t, toastKey: p.toastKey + 1 })) }
  renderVals() {
    const D = this.D, s = this.state.s, w = this.state.w
    if (!D || !s || !w) return { month: [], proofStats: [], week: [], tiers: [], slots: [], items: [], badges: [], milestones: [], days: [], earnRows: [], burst: [] }
    const id = s.crew.id
    const g = D.game(id), lv = D.level(w.xp), gr = D.gear(w)
    const coin = (n) => n.toLocaleString()
    const today = D.todayKey(), opened = w.chestDay === today
    const reward = D.chestReward(id)
    const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0)
    const hrs = Math.floor((mid - now) / 3600000), mins = Math.floor(((mid - now) % 3600000) / 60000)
    const openDrop = () => {
      if (this.state.opening) return
      this.setState({ opening: true })
      this.t1 = setTimeout(() => {
        const ww = D.wallet(id); ww.chestDay = today; D.saveWallet(id, ww)
        D.earn(id, reward, 'Daily supply drop')
        this.setState({ opening: false, burst: true })
      }, 700)
    }
    const items = D.SHOP.filter((x) => x.slot === this.state.slot).map((it, i) => {
      const own = w.owned.includes(it.id), on = w.equipped[it.slot] === it.id, afford = w.coins >= it.price
      const prevGear = { ...gr, [it.slot]: it }
      let btnText, act, disabled = false, btnBg, btnColor, btnBorder = '0', btnShadow = 'none', cursor = 'pointer'
      if (on) { btnText = 'Wearing'; disabled = true; btnBg = 'var(--paper-deep)'; btnColor = 'var(--muted)'; cursor = 'default' }
      else if (own) { btnText = 'Wear'; act = () => { D.equip(id, it.id); this.setState((p) => ({ gearKey: p.gearKey + 1 })); this.say(`Now wearing ${it.name}`) }; btnBg = 'var(--panel)'; btnColor = 'var(--ink)'; btnBorder = '2px solid var(--ink)'; btnShadow = '0 4px 0 var(--ink)' }
      else if (it.level) { btnText = `Unlocks at level ${it.level}`; disabled = true; btnBg = 'transparent'; btnColor = 'var(--muted)'; btnBorder = '2px dashed var(--rule-strong)'; cursor = 'default' }
      else if (it.set) { btnText = `Complete the ${(D.SETS.find((x) => x.id === it.set) || {}).name}`; disabled = true; btnBg = 'transparent'; btnColor = 'var(--muted)'; btnBorder = '2px dashed var(--rule-strong)'; cursor = 'default' }
      else if (it.pass) { btnText = 'Earn on the mission pass'; disabled = true; btnBg = 'transparent'; btnColor = 'var(--muted)'; btnBorder = '2px dashed var(--rule-strong)'; cursor = 'default' }
      else if (afford) { btnText = `Buy for ${it.price}`; act = () => { if (D.buy(id, it.id)) { this.setState((p) => ({ gearKey: p.gearKey + 1 })); this.say(`Unlocked ${it.name}`) } }; btnBg = 'var(--ink)'; btnColor = 'var(--paper)'; btnShadow = '0 4px 0 #000' }
      else { btnText = `Need ${it.price - w.coins} more`; disabled = true; btnBg = 'transparent'; btnColor = 'var(--muted)'; btnBorder = '2px dashed var(--rule-strong)'; cursor = 'not-allowed' }
      return {
        name: it.name, gear: prevGear, isBanner: it.slot === 'banner', bannerBg: it.bg, stage: it.slot === 'banner' ? 'transparent' : 'var(--panel-2)',
        equipped: on, border: on ? 'var(--ink)' : RARITY_BORDER[D.rarity(it)], delay: i * 50 + 'ms', rarity: D.rarity(it), rarityLabel: RARITY_LABEL[D.rarity(it)], rarityInk: RARITY_INK[D.rarity(it)], featured: D.featuredToday().includes(it.id),
        priceText: it.pass ? (own ? 'Owned' : 'Pass reward') : it.price === 0 ? 'Free' : own ? 'Owned' : coin(it.price), priceColor: own || it.price === 0 ? 'var(--muted)' : 'var(--ink)', coinOp: own || it.price === 0 || it.pass ? 0 : 1,
        btnText, act, disabled, btnBg, btnColor, btnBorder, btnShadow, cursor,
      }
    })
    const ach = D.achievements(id)
    const maxDays = 30
    const milestones = D.MILESTONES.map((m, i) => {
      const reached = g.streak >= m.days, claimed = (w.claimed || []).includes(m.days)
      return {
        days: m.days, label: `${m.days} days`, coins: m.coins, align: i === 0 ? 'flex-start' : i === 3 ? 'flex-end' : 'center',
        bg: reached ? 'linear-gradient(135deg, #ffb066, #e8742c)' : 'var(--paper-deep)', color: reached ? '#ffffff' : 'var(--muted)', ring: reached ? '#e8742c' : 'var(--rule)',
        anim: reached && !claimed ? 'rw-float 2s ease-in-out infinite' : 'none',
        claimable: reached && !claimed, static: !(reached && !claimed),
        rewardText: claimed ? 'Claimed' : `+${m.coins}`, rewardColor: claimed ? 'var(--muted)' : 'var(--ink)',
        claim: () => { const ww = D.wallet(id); ww.claimed = [...(ww.claimed || []), m.days]; D.saveWallet(id, ww); D.earn(id, m.coins, `${m.days}-day streak`) },
      }
    })
    const TIER = 120, sxp = D.seasonXp(id), tierNow = Math.min(20, Math.floor(sxp / TIER))
    // Season 1: 20 tiers. The second half adds gear only the pass gives out.
    const PR = [['c', 25], ['i', 'visor-night'], ['c', 40], ['i', 'patch-comet'], ['c', 60], ['i', 'banner-orbit'], ['c', 80], ['i', 'top-halo'], ['c', 120], ['i', 'frame-holo'],
      ['c', 60], ['i', 'patch-pass'], ['c', 80], ['i', 'visor-pass'], ['c', 100], ['i', 'suit-pass'], ['c', 120], ['i', 'banner-pass'], ['c', 150], ['i', 'frame-pass']]
    const tiers = PR.map(([k, v], i) => {
      const n = i + 1, reached = tierNow >= n, claimed = (w.pass || []).includes(n)
      const item = k === 'i' ? D.SHOP.find((x) => x.id === v) : null
      const claimable = reached && !claimed
      return {
        n, isCoins: k === 'c', isItem: k === 'i', coins: k === 'c' ? '+' + v : '', gear: item ? { ...gr, [item.slot]: item } : gr, name: item ? item.name : `${v} coins`,
        bg: claimable ? 'rgba(246,196,69,.16)' : 'rgba(243,241,234,.06)', border: claimable ? '#f6c445' : reached ? 'rgba(243,241,234,.3)' : 'rgba(243,241,234,.1)', op: reached ? 1 : 0.6,
        tile: 'rgba(243,241,234,.08)', btn: claimed ? 'Claimed' : claimable ? 'Claim' : `${n * TIER - sxp} XP`, disabled: !claimable,
        btnBg: claimable ? '#f6c445' : 'rgba(243,241,234,.1)', btnInk: claimable ? '#3b2a00' : 'rgba(243,241,234,.7)', btnShadow: claimable ? '0 3px 0 #a8740a' : 'none', cursor: claimable ? 'pointer' : 'default',
        claim: () => {
          const ww = D.wallet(id); ww.pass = [...(ww.pass || []), n]
          if (item) { ww.owned = Array.from(new Set([...ww.owned, item.id])); D.saveWallet(id, ww); this.say(`Unlocked ${item.name}`) }
          else { D.saveWallet(id, ww); D.earn(id, v, `Mission pass tier ${n}`) }
        },
      }
    })
    const mon = g.month || Array(30).fill(0)
    const month = mon.map((v, i) => ({ bg: v === 2 ? '#e8742c' : v === 1 ? '#ffc896' : 'var(--paper-deep)', ring: i === 29 ? '0 0 0 2px var(--ink)' : 'none', delay: i * 18 + 'ms' }))
    const last7 = mon.slice(-7), wk = last7.filter((v) => v > 0).length
    return {
      month, proofAria: `${mon.filter((v) => v > 0).length} of the last 30 days checked in`,
      proofStats: [{ k: 'Days checked in', v: `${mon.filter((v) => v > 0).length}/30` }, { k: 'Best streak', v: `${g.best || g.streak} d` }, { k: 'Exercise days', v: mon.filter((v) => v === 2).length }, { k: 'Symptoms reported', v: g.symptoms }],
      week: last7.map((v) => (v ? '#f6c445' : 'rgba(243,241,234,.16)')), weekText: wk >= 6 ? 'Challenge complete' : `${wk} of 6 so far`,
      shields: g.shields ?? 0, shieldS: (g.shields ?? 0) === 1 ? '' : 's', shieldIcon: D.ICONS.shield,
      tiers, passTier: tierNow, passPct: ((sxp % TIER) / TIER) * 100 + '%', passToNext: tierNow >= 20 ? 'Pass complete' : `${TIER - (sxp % TIER)} XP to tier ${tierNow + 1}`,
      crew: s.crew, gear: gr, gearKey: this.state.gearKey, bannerBg: gr.banner.bg, lvl: lv.n, rank: lv.rank, crewRole: s.crew.role, crewName: s.crew.name,
      xpText: `${lv.into} / ${lv.need} XP`, xpToGo: `${lv.need - lv.into} to level ${lv.n + 1}`, xpPct: lv.frac * 100 + '%', xpPctNum: Math.round(lv.frac * 100),
      coinsShown: coin(this.state.shown), streak: g.streak, flameIcon: D.ICONS.flame, badgeCount: ach.filter((a) => a.got).length, badgeTotal: ach.length,
      dropReady: !opened, dropOpened: opened, dropReward: reward, nextDrop: `${hrs} h ${mins} min`, openDrop,
      chestKey: this.state.opening ? 1 : 0, chestAnim: this.state.opening ? 'rw-shake 700ms ease-in-out' : opened ? 'none' : 'rw-float 3s ease-in-out infinite', lidT: opened ? 'rotate(-28deg) translateY(-6px)' : 'none',
      burst: opened && this.state.burst ? Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i - 4.5) * 0.28; return { dx: Math.cos(a) * 90 + 'px', dy: Math.sin(a) * 90 + 'px', rot: i * 40 + 'deg', delay: (i % 4) * 50 + 'ms' } }) : [],
      trackPct: Math.min(100, (Math.min(g.streak, maxDays) / maxDays) * 100) + '%', milestones,
      days: g.days.map((x) => ({ bg: x ? 'linear-gradient(135deg, #ffb066, #e8742c)' : 'var(--paper-deep)', color: x ? '#ffffff' : 'var(--rule-strong)', op: x ? 1 : 0.5 })),
      badges: ach.map((a) => ({
        ...a, icon: D.ICONS[a.icon], locked: !a.got,
        bg: a.got ? 'var(--panel-2)' : 'transparent', border: a.got ? '1px solid var(--rule)' : '1.5px dashed var(--rule-strong)',
        tileBg: a.got ? 'var(--ink)' : 'var(--paper-deep)', tileColor: a.got ? '#f6c445' : 'var(--muted)', tileShadow: a.got ? '0 6px 0 #000' : 'none', nameColor: a.got ? 'var(--ink)' : 'var(--muted)',
      })),
      slots: D.SLOTS.map(([k, label]) => { const on = this.state.slot === k; return { label, on: String(on), pick: () => this.setState({ slot: k }), bg: on ? 'var(--panel)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)', shadow: on ? '0 1px 2px rgba(20,24,31,.1), 0 4px 12px -6px rgba(20,24,31,.25)' : 'none' } }),
      slot: this.state.slot, items,
      // One source: today's goals (D.todayTasks), then the earn-once extras. Never coins for a value.
      earnRows: [
        ...D.todayTasks(id).map((g) => ({ t: g.optional ? `${g.label} (bonus goal)` : `${g.label} (daily goal)`, c: `+${g.points}`, icon: D.ICONS[g.icon] || D.ICONS.spark })),
        { t: 'Retake a reading the app could not trust', c: `+${D.POINTS.retakeAfterQualityFail}`, icon: D.ICONS.clock },
        { t: 'Daily supply drop', c: `+${D.chestReward()}`, icon: D.ICONS.award },
        { t: 'Streak milestones at 3, 7, 14 and 30 days', c: `+${D.POINTS.streakMilestone} each`, icon: D.ICONS.flame },
        { t: 'Find every discovery in a mission banner (gear coins only, once)', c: `+${D.SCENE_BONUS}`, icon: D.ICONS.spark },
      ],
      title: D.levelPerks(id).title,
      toast: this.state.toast, toastKey: this.state.toastKey,
    }
  }
}
