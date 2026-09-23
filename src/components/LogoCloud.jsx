import React from 'react';

const PARTNERS = [
  {
    name: 'Partner 1',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBt3dysR_9v9B0-uRlbC1pjyMZHSlXEi9oAIfD57qWOi5gMD6WjOOH2DMGjtanZmrjUS3CHwJgXd6PzMKZCjYP5PavVyNSBgnWCdz3xsEoAZujFQWISyB_YDeTBNtiuniBDOrVjBbgLKksLIAKeIOeyApc_yhPMhgVuiwjrGydUy3eebE-MLLwygauSKGVF4v9gkXgpA0_TY8iWZuqt4UbxtKwhYvImFnUzaD8Rp9lMiKyXCWYxM8FhA',
  },
  {
    name: 'Partner 2',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTTi4Qy5ahajiMJY5vA_8yWI7umeDYKsvF2MZiFX4gQsb-JgJP-FWhyaOBdUnpHbCYXleXSWQYMuh3MeJWZk4xZc1YDKkXKK2im0eI1o7qzLOFbh-u9e4q67O8RZGj-WKk4urn-9vV1DZ0hfvqGm6erqUWHMc7IiXxal_L35ED_rL49knTL3xNPT2Eu-FNoICrbZJrvWs3jYT9xZTIM8SK_WdV-UN1ftA2CWRK7by6RFPhtpK_Z8ps6Q',
  },
  {
    name: 'Partner 3',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN6MlPDCW6DBxSXbF3A_mThTtfiS7zpZQdIATBtHatB035BIGExA17J8NJaIgVhS9Q2-16KZoFWOLP4jlsGVoEy6EwfnpYzLNWp_ADgSCMqIXV_ByxROXhmOjtSBIpkPi6I3bRP3hEM06Iu78tXlzuWQRPmXK7LvyQepisDdq_gxf5Xll92RiAw9g1RqDcD7lX2tTb2urUqAij84XD0xADgarmrp86IfJAq5dsxtaqbxRa4_E21SbT6w',
  },
  {
    name: 'Partner 4',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQXZpaoMIr_6AOS_nYBHXnqglfH7hH5xc06QnYDLdOwYu5U0Ill1UiGHBrd6fN8zpOZena-8wtJWXxf3zX67dluXgLdBxiGaW_IzS8zLMOjIUIYKOaHRpGK5VtGwZ6aIGd5WSFodAgmZInN4WEA65fUC7Xlyz5lGD-RfCUpka4KCTTENfTCO06LrZjYt4ma-rIKPibcBtHay3381LrKlO7X4oxXEn3B1IMxdsd76JKnCfMM-IPsAEE5w',
  },
  {
    name: 'Partner 5',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeraXfRY1t2mFkQnucWETl5kCAtrtUeK8PGZHuylQv0MDAvg6qGJ6veu2B3JOiBhlUyfKo5idYHfli7Ufify9-ZXFqLAIewWyzPCOr2-LY7aaxdTPivz4xnE2EPvhdyd8CBreo8k1-xIzdXdttUDoFy_NKBENlljrB7ByEuosdShgmdiP13i9TjLfsiXckcT4gAjqb3fMmHXDKS59BO-kAy9z4LPW2n9eoI9mkuCkhqoplD6ByXottIg',
  },
];

export default function LogoCloud() {
  return (
    <section className="py-24">
      <div className="px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto">
        <p className="font-label-md text-label-md text-outline text-center uppercase tracking-[0.2em] mb-12">
          Trusted Global Partners
        </p>
        <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-40 hover:opacity-80 transition-opacity duration-300">
          {PARTNERS.map((partner, index) => (
            <img
              key={index}
              alt={partner.name}
              className="h-7 w-auto grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
              src={partner.logo}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
