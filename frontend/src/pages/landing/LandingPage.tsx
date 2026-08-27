import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, Package, Users, Truck, BarChart3, Shield,
  CheckCircle, ArrowRight, ChevronDown, ChevronUp, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function LandingPage() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    { icon: ShoppingCart, titleKey: 'landing.feature1Title', descKey: 'landing.feature1Desc' },
    { icon: Package, titleKey: 'landing.feature2Title', descKey: 'landing.feature2Desc' },
    { icon: Users, titleKey: 'landing.feature3Title', descKey: 'landing.feature3Desc' },
    { icon: Shield, titleKey: 'landing.feature4Title', descKey: 'landing.feature4Desc' },
    { icon: BarChart3, titleKey: 'landing.feature5Title', descKey: 'landing.feature5Desc' },
    { icon: BarChart3, titleKey: 'landing.feature6Title', descKey: 'landing.feature6Desc' },
    { icon: Truck, titleKey: 'landing.feature7Title', descKey: 'landing.feature7Desc' },
    { icon: ShoppingCart, titleKey: 'landing.feature8Title', descKey: 'landing.feature8Desc' },
  ]

  const problems = [
    { titleKey: 'landing.problem1Title', descKey: 'landing.problem1Desc' },
    { titleKey: 'landing.problem2Title', descKey: 'landing.problem2Desc' },
    { titleKey: 'landing.problem3Title', descKey: 'landing.problem3Desc' },
    { titleKey: 'landing.problem4Title', descKey: 'landing.problem4Desc' },
  ]

  const solutions = [
    { titleKey: 'landing.solution1Title', descKey: 'landing.solution1Desc' },
    { titleKey: 'landing.solution2Title', descKey: 'landing.solution2Desc' },
    { titleKey: 'landing.solution3Title', descKey: 'landing.solution3Desc' },
    { titleKey: 'landing.solution4Title', descKey: 'landing.solution4Desc' },
  ]

  const steps = [
    { num: 1, titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
    { num: 2, titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
    { num: 3, titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
    { num: 4, titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
  ]

  const plans = [
    {
      nameKey: 'landing.freePlan', descKey: 'landing.freePlanDesc', priceKey: 'landing.freePlanPrice', periodKey: 'landing.freePlanPeriod',
      features: [t('landing.freePlanFeature1'), t('landing.freePlanFeature2'), t('landing.freePlanFeature3'), t('landing.freePlanFeature4')],
    },
    {
      nameKey: 'landing.proPlan', descKey: 'landing.proPlanDesc', priceKey: 'landing.proPlanPrice', periodKey: 'landing.proPlanPeriod', popular: true,
      features: [t('landing.proPlanFeature1'), t('landing.proPlanFeature2'), t('landing.proPlanFeature3'), t('landing.proPlanFeature4'), t('landing.proPlanFeature5'), t('landing.proPlanFeature6')],
    },
    {
      nameKey: 'landing.enterprisePlan', descKey: 'landing.enterprisePlanDesc', priceKey: 'landing.enterprisePlanPrice', periodKey: 'landing.enterprisePlanPeriod',
      features: [t('landing.enterprisePlanFeature1'), t('landing.enterprisePlanFeature2'), t('landing.enterprisePlanFeature3'), t('landing.enterprisePlanFeature4'), t('landing.enterprisePlanFeature5'), t('landing.enterprisePlanFeature6')],
    },
  ]

  const faqs = [
    { qKey: 'landing.faq1Question', aKey: 'landing.faq1Answer' },
    { qKey: 'landing.faq2Question', aKey: 'landing.faq2Answer' },
    { qKey: 'landing.faq3Question', aKey: 'landing.faq3Answer' },
    { qKey: 'landing.faq4Question', aKey: 'landing.faq4Answer' },
  ]

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">B</div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Business OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t('landing.featuresTitle')}</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t('landing.pricingTitle')}</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t('landing.faqTitle')}</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">{t('auth.login')}</Button></Link>
            <Link to="/register"><Button size="sm">{t('landing.getStarted')}</Button></Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">{t('landing.heroTitle')}</h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('landing.heroSubtitle')}</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register"><Button size="lg">{t('landing.getStarted')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/shop"><Button size="lg" variant="outline">{t('landing.viewDemo')}</Button></Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-4 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.problemsTitle')}</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold">{i + 1}</div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{t(p.titleKey)}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t(p.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.solutionsTitle')}</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {solutions.map((s, i) => (
              <div key={i} className="rounded-xl border border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-900/10">
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-20 px-4 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.featuresTitle')}</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <f.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{t(f.titleKey)}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t(f.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.howItWorksTitle')}</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">{s.num}</div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-gray-50 py-20 px-4 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.pricingTitle')}</h2>
          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{t('landing.pricingSubtitle')}</p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-xl border-2 p-8 bg-white dark:bg-gray-800 ${plan.popular ? 'border-primary-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}>
                {plan.popular && <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">Popular</span>}
                <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{t(plan.nameKey)}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(plan.descKey)}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{t(plan.priceKey)}</span>
                  <span className="text-gray-500 dark:text-gray-400"> UZS/{t(plan.periodKey)}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>{t('landing.choosePlan')}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('landing.faqTitle')}</h2>
          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{t(faq.qKey)}</span>
                  {openFaq === i ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400">{t(faq.aKey)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-600 py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white">{t('landing.ctaTitle')}</h2>
          <p className="mt-4 text-primary-100">{t('landing.ctaSubtitle')}</p>
          <Link to="/register" className="mt-8 inline-block">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              {t('landing.ctaButton')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-12 px-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">B</div>
                <span className="font-bold text-gray-900 dark:text-white">Business OS</span>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('landing.footerDescription')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{t('landing.footerProduct')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">{t('landing.featuresTitle')}</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 dark:hover:text-white">{t('landing.pricingTitle')}</a></li>
                <li><Link to="/shop" className="hover:text-gray-900 dark:hover:text-white">{t('shop.title')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{t('landing.footerCompany')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerAbout')}</span></li>
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerBlog')}</span></li>
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerCareers')}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{t('landing.footerSupport')}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerContact')}</span></li>
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerPrivacy')}</span></li>
                <li><span className="hover:text-gray-900 dark:hover:text-white">{t('landing.footerTerms')}</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {t('landing.footerRights')} Business OS
          </div>
        </div>
      </footer>
    </div>
  )
}
