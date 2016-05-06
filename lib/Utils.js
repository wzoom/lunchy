

export default class Utils {

  static suffixOrdinal(n) {
    const s=['th','st','nd','rd'], v=n%100
    return n+(s[(v-20)%10]||s[v]||s[0])
  }


}
