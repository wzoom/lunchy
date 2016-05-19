import SlackFormatter from '../lib/SlackFormatter'
import {expect} from 'chai'


describe('SlackFormatter', function() {

  describe('Format Zomato Menus for Slack', function () {
    let menus = [
      {"daily_menu_id":18141177,"start_date":"2016-05-19 00:00:00","end_date":"2016-05-19 23:59:59","name":"First","dishes":[{"dish":{"dish_id":600681810,"name":"ČOČKOVÁ POLÉVKA S KLOBÁSOU       0,25l","price":"25 Kč"}},{"dish":{"dish_id":600681811,"name":"tip šéfkuchaře – FILET ČERSTVÉ TRESKY TMAVÉ S CITRÓNOVÝM PEPŘEM, MLADÁ KAROTKA A ŘEDKVIČKY S BYLINKOVÝM MÁSLEM, HRÁŠKOVÉ PYRÉ, GRILOVANÝ CITRON  170g - neobsahuje lepek","price":"139 Kč"}},{"dish":{"dish_id":600681812,"name":"1.LASAGNE BOLOGNESE, TRHANÉ LISTOVÉ SALÁTY S BALSAMICEM           250g","price":"109 Kč"}},{"dish":{"dish_id":600681813,"name":"2.RAGÚ Z KRŮTÍHO MASA NA ČERVENÉM VÍNĚ SE ZELENINOU, ŠUNKOVÁ RÝŽE           150g - neobsahuje lepek","price":"99 Kč"}},{"dish":{"dish_id":600681814,"name":"DEZERT:  SACHER ŘEZ SE ŠLEHAČKOU           ","price":"30 Kč"}}]},
      {"daily_menu_id":18145897,"start_date":"2016-05-19 00:00:00","end_date":"2016-05-19 23:59:59","name":"Second","dishes":[{"dish":{"dish_id":604492999,"name":"Polévka: Zeleninová","price":"39 Kč"}},{"dish":{"dish_id":604493000,"name":"Polévka+ hot dog (Kečup, rukola, kyselá okurka, jalapeńos, majonéza)","price":"99 Kč"}},{"dish":{"dish_id":604493001,"name":"Polévka+ burger dne 1 (Hov. maso, kečup,ledový salát, okurka, slanina)","price":"119 Kč"}},{"dish":{"dish_id":604493002,"name":"Polévka+ burger dne 2 (Hov. maso, BBQ, polníček, brusinková om.,jablko se skořicí, smetana)","price":"119 Kč"}},{"dish":{"dish_id":604493003,"name":"Menu steak: 120g Krkovice, vesnické hranolky","price":"129 Kč"}},{"dish":{"dish_id":604493004,"name":"Steak dne: 200g Kuřecí prso, variace salátů, hořčičná omáčka","price":"169 Kč"}},{"dish":{"dish_id":604493005,"name":"Speciální nabídka: 200g Jelení klobásky, křen, hořčice, pečivo","price":"139 Kč"}},{"dish":{"dish_id":604493006,"name":"Dezert: Hruškový koláč","price":"39 Kč"}}]}
    ];


    it('Should contain 2 attachments', function () {

      let formatted = SlackFormatter.formatMenus(menus);

      expect(formatted).to.have.lengthOf(2)
      expect(formatted[0].dishes).not.to.be.empty




    });
  });
});
