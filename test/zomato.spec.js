import zomatoService from '../lib/ZomatoService'
import {expect} from 'chai';


describe('ZomatoService', function() {
  describe('Search Zomato for "hoffa"', function () {
    it('Search Zomato for "hoffa"', function (done) {
      this.timeout(5000);
      zomatoService.searchRestaurants('hoffa praha').then((res) => {
        expect(res).to.be.an('object');
        expect(res.results_found).to.be.at.least(1);
        expect(res.restaurants).to.be.an('array');
        expect(res.restaurants).to.have.length.above(0);


        done();
      })

    });
  });
});
