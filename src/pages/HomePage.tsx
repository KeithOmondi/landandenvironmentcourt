
import Elc from "../components/layout/Elc"
import Hero from "../components/layout/Hero"
//import Navbar from "../components/layout/Navbar"
import PrincipalMessage from "../components/layout/PrincipalMessage"
import QuickNav from "../components/layout/QuickNav"
import CoreValues from "./CoreValues"


const HomePage = () => {
  return (
    <div>
       
        <Hero />
        <QuickNav />
        <PrincipalMessage />
        <Elc />
        <CoreValues />
    </div>
  )
}

export default HomePage